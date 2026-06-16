package expo.modules.observe

import android.content.Context
import android.util.Log
import expo.modules.easclient.EASClientID
import expo.modules.observe.storage.PendingLogsManager
import expo.modules.observe.storage.PendingMetricsManager
import expo.modules.appmetrics.storage.SessionManager
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.interfaces.constants.ConstantsInterface
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class ObservabilityManager(
  // TODO(@lukmccall): Consider saving context as weak reference to avoid potential memory leaks
  private val context: Context,
  constants: ConstantsInterface?,
  val sessionManager: SessionManager
) {
  private val baseManager: BaseObservabilityManager

  // TODO: Can this information change during expo module lifecycle?
  init {
    val manifest = getManifest(constants)
    checkNotNull(manifest) {
      "Manifest is required to initialize ObservabilityManager."
    }

    val projectId = manifest.projectId
    checkNotNull(projectId) {
      "Project ID is required to send observability metrics. Make sure you have configured it correctly in app.json."
    }
    val baseUrl = manifest.baseUrl ?: OBSERVE_DEFAULT_BASE_URL

    val pendingMetricsManager = PendingMetricsManager(context)
    val pendingLogsManager = PendingLogsManager(context)

    baseManager = BaseObservabilityManager(
      context = context,
      sessionManager = sessionManager,
      pendingMetricsManager = pendingMetricsManager,
      pendingLogsManager = pendingLogsManager,
      projectId = projectId,
      baseUrl = baseUrl,
      isDebugBuild = BuildConfig.DEBUG
    )

    sessionManager.addMetricsInsertListener { metricIds ->
      pendingMetricsManager.addPendingMetrics(metricIds)
    }
    sessionManager.addLogsInsertListener { logIds ->
      pendingLogsManager.addPendingLogs(logIds)
    }
  }

  suspend fun dispatchUnsentMetrics() {
    baseManager.dispatchUnsentMetrics()
  }

  suspend fun dispatchUnsentLogs() {
    baseManager.dispatchUnsentLogs()
  }

  fun scheduleBackgroundDispatch() {
    ObservabilityBackgroundWorker.scheduleBackgroundDispatch(
      context = context,
      projectId = baseManager.projectId,
      baseUrl = baseManager.baseUrl
    )
  }

  // Manager-owned scope so the periodic dispatch loop has a lifecycle tied to module destroy
  // rather than to a single JS-call dispatch (`modulesQueue`, which is per-call). `Dispatchers.IO`
  // is the right pool: each wake reads pending tables, queries the DB, and POSTs to the endpoint.
  private val dispatchScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
  private var dispatchJob: Job? = null

  @Volatile
  private var dispatchIntervalSeconds: Long? = null

  /**
   * Configures the periodic dispatch loop. A positive `intervalSeconds` starts the loop (on its
   * first call) and tells it to flush pending metrics and logs that often, so a long-running app
   * sends in-session telemetry without waiting for `OnActivityEntersBackground`. Subsequent calls
   * update the interval in place — the next wake uses the new value. Passing `null` or `0` leaves
   * the loop idle (no-ops at each wake). Driven by
   * `Observe.configure({ scheduledDispatchInterval })`.
   */
  fun setDispatchIntervalSeconds(intervalSeconds: Long?) {
    dispatchIntervalSeconds = intervalSeconds
    if (dispatchJob == null && intervalSeconds != null && intervalSeconds > 0) {
      dispatchJob = dispatchScope.launch {
        while (true) {
          // Idle in a 1-minute heartbeat while the interval is cleared, so a later re-configure
          // resumes promptly. Matches iOS.
          val interval = dispatchIntervalSeconds?.coerceAtLeast(1) ?: 60
          delay(interval * 1000)
          val configured = dispatchIntervalSeconds ?: continue
          if (configured <= 0) {
            continue
          }
          try {
            baseManager.dispatchUnsentMetrics()
            baseManager.dispatchUnsentLogs()
          } catch (e: Exception) {
            Log.w(OBSERVE_TAG, "Periodic dispatch failed: ${e.message}")
          }
        }
      }
    }
  }

  /**
   * Cancels the periodic dispatch loop. Called from `ObserveModule.OnDestroy` so the loop doesn't
   * try to hit the network or DB after the module's lifecycle has ended.
   */
  fun destroy() {
    dispatchScope.cancel()
    dispatchJob = null
  }
}

class BaseObservabilityManager(
  private val context: Context,
  private val sessionManager: SessionManager,
  private val pendingMetricsManager: PendingMetricsManager,
  private val pendingLogsManager: PendingLogsManager,
  val projectId: String,
  val baseUrl: String,
  private val isDebugBuild: Boolean = false,
  private val deterministicUniformValueProvider: () -> Double = {
    EASClientID.deterministicUniformValue(EASClientID(context).uuid)
  },
  private val currentTimeMs: () -> Long = { TimeUtils.getWallClockMillis() }
) {
  private val eventDispatcher = EventDispatcher(
    context = context,
    projectId = projectId,
    baseUrl = baseUrl
  )

  /**
   * In-memory retry-gate state, kept independently per OTLP endpoint. The `/v1/metrics` and
   * `/v1/logs` endpoints fail independently in practice (one schema validation disagreement
   * on the metrics side shouldn't suppress a healthy logs stream), so each signal carries
   * its own consecutive-failure counter and dispatch-after deadline. A single shared field
   * would conflate the two: a recovering signal would reset the other's counter on success,
   * and a server's `Retry-After` on one endpoint would silently overwrite a longer backoff
   * computed for the other.
   *
   * State is reset implicitly when the process restarts — a relaunch usually means enough
   * time passed that the transient cause has cleared anyway, and persisting the gates would
   * mean a disk write per retryable response.
   */
  private var metricsRetryGate: DispatchUtils.RetryGateState = DispatchUtils.RetryGateState.initial
  private var logsRetryGate: DispatchUtils.RetryGateState = DispatchUtils.RetryGateState.initial

  /**
   * Per-signal mutexes that serialize same-signal dispatch calls. Two `dispatchEvents`
   * invocations from JS can otherwise land on the same `BaseObservabilityManager` instance
   * concurrently and race on the gate's read-modify-write (and double-POST the same pending
   * rows). The metrics and logs paths take separate mutexes so they can still run in
   * parallel — only same-signal calls serialize.
   *
   * Worst case without these would be benign (a dropped gate update or a duplicate dispatch),
   * since the pending-ID stores are already DB-backed and telemetry is best-effort — but the
   * gate is in-memory state with no other synchronization, so close the race explicitly.
   */
  private val metricsDispatchMutex = Mutex()
  private val logsDispatchMutex = Mutex()

  /**
   * Returns true and logs when an active retry gate suppresses this dispatch round. Called
   * inside each per-signal dispatch method rather than at a shared entry point, so a backoff
   * on one endpoint doesn't suppress traffic on the other.
   */
  private fun retryGateBlocks(state: DispatchUtils.RetryGateState, signal: String): Boolean {
    val until = state.dispatchAfterMs ?: return false
    val now = currentTimeMs()
    if (until <= now) return false
    Log.d(OBSERVE_TAG, "$signal dispatch suppressed by retry gate until $until (now $now)")
    return true
  }

  /**
   * Computes the next gate state for a given current state and dispatch result. Each per-
   * signal call site assigns the return value back to its own field — the manager doesn't
   * share a single mutable state across signals, so the metrics and logs gates can't drift
   * out of sync from cross-signal updates.
   */
  private fun nextGate(
    current: DispatchUtils.RetryGateState,
    result: DispatchResult
  ): DispatchUtils.RetryGateState = DispatchUtils.nextRetryGateState(
    result = result,
    currentState = current,
    now = currentTimeMs(),
    backoff = { DispatchUtils.computeBackoffDelay(it) }
  )

  suspend fun dispatchUnsentMetrics(): Unit = metricsDispatchMutex.withLock {
    val pendingIds = pendingMetricsManager.getAllPendingMetricIds()
    if (pendingIds.isEmpty()) {
      return
    }

    if (retryGateBlocks(metricsRetryGate, "metrics")) {
      return
    }

    if (!shouldDispatch()) {
      pendingMetricsManager.removePendingMetrics(pendingIds)
      return
    }

    val sessionsWithPendingMetrics = sessionManager.getSessionsWithMetrics(pendingIds)

    // Clean up orphaned pending IDs (metrics deleted from MetricsDatabase but still in pending table)
    val resolvedMetricIds = sessionsWithPendingMetrics.flatMap { it.metrics }.map { it.metricId }.toSet()
    val orphanedIds = pendingIds.filter { it !in resolvedMetricIds }
    if (orphanedIds.isNotEmpty()) {
      pendingMetricsManager.removePendingMetrics(orphanedIds)
    }

    if (sessionsWithPendingMetrics.isEmpty()) {
      return
    }

    val events = sessionsWithPendingMetrics.map { sessionWithMetrics ->
      Event(
        metadata = Metadata.fromSessionMetadata(sessionWithMetrics.session),
        metrics = sessionWithMetrics.metrics.map { EASMetric.fromMetric(it) }
      )
    }

    val result = eventDispatcher.dispatch(events)
    metricsRetryGate = nextGate(metricsRetryGate, result)
    val dispatchedMetricIds = sessionsWithPendingMetrics.flatMap { it.metrics }.map { it.metricId }
    if (DispatchUtils.shouldRemovePending(result)) {
      pendingMetricsManager.removePendingMetrics(dispatchedMetricIds)
    }
    when (result) {
      is DispatchResult.PartialSuccess ->
        Log.w(
          OBSERVE_TAG,
          "Partial success on batch of ${dispatchedMetricIds.size} metric event(s): " +
            "server rejected ${result.partial.rejectedCount} " +
            "(${result.partial.errorMessage ?: "no error message"})"
        )
      is DispatchResult.NonRetryableFailure ->
        Log.w(
          OBSERVE_TAG,
          "Dropping batch of ${dispatchedMetricIds.size} metric event(s): ${result.reason}"
        )
      is DispatchResult.Success, is DispatchResult.RetryableFailure -> Unit
    }
  }

  /**
   * Dispatches log events to `/v1/logs`. Independent from the metrics path —
   * a logs failure doesn't affect the metrics pending table and vice versa.
   */
  suspend fun dispatchUnsentLogs(): Unit = logsDispatchMutex.withLock {
    val pendingIds = pendingLogsManager.getAllPendingLogIds()
    if (pendingIds.isEmpty()) {
      return
    }

    if (retryGateBlocks(logsRetryGate, "logs")) {
      return
    }

    if (!shouldDispatch()) {
      pendingLogsManager.removePendingLogs(pendingIds)
      return
    }

    val sessionsWithPendingLogs = sessionManager.getSessionsWithLogs(pendingIds)

    // Clean up orphaned pending IDs (logs deleted from the `logs` table but
    // still tracked in `pending_logs`).
    val resolvedLogIds = sessionsWithPendingLogs.flatMap { it.logs }.map { it.logId }.toSet()
    val orphanedIds = pendingIds.filter { it !in resolvedLogIds }
    if (orphanedIds.isNotEmpty()) {
      pendingLogsManager.removePendingLogs(orphanedIds)
    }

    if (sessionsWithPendingLogs.isEmpty()) {
      return
    }

    val events = sessionsWithPendingLogs.map { sessionWithLogs ->
      Event(
        metadata = Metadata.fromSessionMetadata(sessionWithLogs.session),
        metrics = emptyList(),
        logs = sessionWithLogs.logs.map { LogEvent.fromLogRecord(it) }
      )
    }

    val result = eventDispatcher.dispatchLogs(events)
    logsRetryGate = nextGate(logsRetryGate, result)
    val dispatchedLogIds = sessionsWithPendingLogs.flatMap { it.logs }.map { it.logId }
    if (DispatchUtils.shouldRemovePending(result)) {
      pendingLogsManager.removePendingLogs(dispatchedLogIds)
    }
    when (result) {
      is DispatchResult.PartialSuccess ->
        Log.w(
          OBSERVE_TAG,
          "Partial success on batch of ${dispatchedLogIds.size} log event(s): " +
            "server rejected ${result.partial.rejectedCount} " +
            "(${result.partial.errorMessage ?: "no error message"})"
        )
      is DispatchResult.NonRetryableFailure ->
        Log.w(
          OBSERVE_TAG,
          "Dropping batch of ${dispatchedLogIds.size} log event(s): ${result.reason}"
        )
      is DispatchResult.Success, is DispatchResult.RetryableFailure -> Unit
    }
  }

  private fun isInSample(): Boolean {
    val rate = ObservePreferences.getConfig(context)?.sampleRate ?: return true
    val clamped = rate.coerceIn(0.0, 1.0)
    return deterministicUniformValueProvider() < clamped
  }

  private fun shouldDispatch(): Boolean {
    val config = ObservePreferences.getConfig(context)
    val dispatchingEnabled = config?.dispatchingEnabled ?: true
    val dispatchInDebug = config?.dispatchInDebug ?: false
    // `isDev` is the OR of the JS-bundle dev flag (pushed via `setBundleDefaults` on JS
    // package import) and the native build's debug flag. Either being true means the
    // bundle should be treated as dev for dispatch-gating.
    val isJsDev = ObservePreferences.getBundleDefaults(context)?.isJsDev ?: false
    val isDev = isDebugBuild || isJsDev
    return dispatchingEnabled && isInSample() && (!isDev || dispatchInDebug)
  }

  suspend fun cleanup() {
    pendingMetricsManager.cleanupOldPendingMetrics()
    pendingLogsManager.cleanupOldPendingLogs()
    // TODO(@ubax): Move sessionManager.cleanupOldSessions out of eas observe
    sessionManager.cleanupOldSessions()
    sessionManager.cleanupOldLogs()
  }
}
