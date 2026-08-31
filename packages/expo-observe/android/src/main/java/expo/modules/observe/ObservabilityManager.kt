package expo.modules.observe

import android.content.Context
import android.util.Log
import expo.modules.easclient.EASClientID
import expo.modules.appmetrics.storage.SessionManager
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.interfaces.constants.ConstantsInterface
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.isActive
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

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

    baseManager = BaseObservabilityManager(
      context = context,
      sessionManager = sessionManager,
      projectId = projectId,
      baseUrl = baseUrl,
      isDebugBuild = BuildConfig.DEBUG
    )
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
}

class BaseObservabilityManager(
  private val context: Context,
  private val sessionManager: SessionManager,
  val projectId: String,
  val baseUrl: String,
  private val isDebugBuild: Boolean = false,
  private val deterministicUniformValueProvider: () -> Double = {
    EASClientID.deterministicUniformValue(EASClientID(context).uuid)
  },
  private val currentTimeMs: () -> Long = { TimeUtils.getWallClockMillis() },
  private val dispatchChunkSize: Int = DISPATCH_CHUNK_SIZE
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
    if (retryGateBlocks(metricsRetryGate, "metrics")) {
      return
    }

    repairMetricCursorIfStale(context, sessionManager)
    if (!shouldDispatch()) {
      val maxId = sessionManager.getMaxMetricId() ?: -1
      if (ObservePreferences.getLastDispatchedMetricId(context) != maxId) {
        ObservePreferences.setLastDispatchedMetricId(context, maxId)
      }
      return
    }

    var cursor = ObservePreferences.getLastDispatchedMetricId(context)
    var chunkSize = dispatchChunkSize
    while (currentCoroutineContext().isActive) {
      val metrics = sessionManager.getMetrics(cursor, chunkSize)
      chunkSize = dispatchChunkSize
      if (metrics.isEmpty()) {
        break
      }

      val highestId = metrics.last().id
      val metricsBySessionId = metrics.groupBy { it.sessionId }
      val sessions = sessionManager.getSessions(metricsBySessionId.keys).associateBy { it.id }
      val events = metricsBySessionId.mapNotNull { (sessionId, sessionMetrics) ->
        sessions[sessionId]?.let { session ->
          Event(
            metadata = Metadata.fromSessionMetadata(session),
            metrics = sessionMetrics.map(EASMetric::fromMetric)
          )
        }
      }
      if (events.isEmpty()) {
        cursor = highestId
        ObservePreferences.setLastDispatchedMetricId(context, cursor)
        continue
      }

      val result = eventDispatcher.dispatch(events)
      metricsRetryGate = nextGate(metricsRetryGate, result)
      when (result) {
        is DispatchResult.PartialSuccess ->
          Log.w(
            OBSERVE_TAG,
            "Partial success on batch of ${metrics.size} metric event(s): " +
              "server rejected ${result.partial.rejectedCount} " +
              "(${result.partial.errorMessage ?: "no error message"})"
          )
        is DispatchResult.NonRetryableFailure ->
          Log.w(OBSERVE_TAG, "Dropping batch of ${metrics.size} metric event(s): ${result.reason}")
        DispatchResult.PayloadTooLarge -> if (metrics.size == 1) {
          Log.w(OBSERVE_TAG, "Dropping metric event that exceeds the server's payload limit")
        }
        DispatchResult.Success, is DispatchResult.RetryableFailure -> Unit
      }
      if (result is DispatchResult.PayloadTooLarge && metrics.size > 1) {
        chunkSize = metrics.size / 2
        continue
      }
      when (result) {
        DispatchResult.Success, is DispatchResult.PartialSuccess -> {
          cursor = highestId
          ObservePreferences.setLastDispatchedMetricId(context, cursor)
        }
        is DispatchResult.NonRetryableFailure, DispatchResult.PayloadTooLarge -> {
          ObservePreferences.setLastDispatchedMetricId(context, highestId)
          break
        }
        is DispatchResult.RetryableFailure -> break
      }
    }
  }

  /**
   * Dispatches log events to `/v1/logs`. Independent from the metrics path —
   * a logs failure doesn't affect the metrics cursor and vice versa.
   */
  suspend fun dispatchUnsentLogs(): Unit = logsDispatchMutex.withLock {
    if (retryGateBlocks(logsRetryGate, "logs")) {
      return
    }

    repairLogCursorIfStale(context, sessionManager)
    if (!shouldDispatch()) {
      val maxId = sessionManager.getMaxLogId() ?: -1
      if (ObservePreferences.getLastDispatchedLogId(context) != maxId) {
        ObservePreferences.setLastDispatchedLogId(context, maxId)
      }
      return
    }

    var cursor = ObservePreferences.getLastDispatchedLogId(context)
    var chunkSize = dispatchChunkSize
    while (currentCoroutineContext().isActive) {
      val logs = sessionManager.getLogs(cursor, chunkSize)
      chunkSize = dispatchChunkSize
      if (logs.isEmpty()) {
        break
      }

      val highestId = logs.last().id
      val logsBySessionId = logs.groupBy { it.sessionId }
      val sessions = sessionManager.getSessions(logsBySessionId.keys).associateBy { it.id }
      val events = logsBySessionId.mapNotNull { (sessionId, sessionLogs) ->
        sessions[sessionId]?.let { session ->
          Event(
            metadata = Metadata.fromSessionMetadata(session),
            metrics = emptyList(),
            logs = sessionLogs.map(LogEvent::fromLogRecord)
          )
        }
      }
      if (events.isEmpty()) {
        cursor = highestId
        ObservePreferences.setLastDispatchedLogId(context, cursor)
        continue
      }

      val result = eventDispatcher.dispatchLogs(events)
      logsRetryGate = nextGate(logsRetryGate, result)
      when (result) {
        is DispatchResult.PartialSuccess ->
          Log.w(
            OBSERVE_TAG,
            "Partial success on batch of ${logs.size} log event(s): " +
              "server rejected ${result.partial.rejectedCount} " +
              "(${result.partial.errorMessage ?: "no error message"})"
          )
        is DispatchResult.NonRetryableFailure ->
          Log.w(OBSERVE_TAG, "Dropping batch of ${logs.size} log event(s): ${result.reason}")
        DispatchResult.PayloadTooLarge -> if (logs.size == 1) {
          Log.w(OBSERVE_TAG, "Dropping log event that exceeds the server's payload limit")
        }
        DispatchResult.Success, is DispatchResult.RetryableFailure -> Unit
      }
      if (result is DispatchResult.PayloadTooLarge && logs.size > 1) {
        chunkSize = logs.size / 2
        continue
      }
      when (result) {
        DispatchResult.Success, is DispatchResult.PartialSuccess -> {
          cursor = highestId
          ObservePreferences.setLastDispatchedLogId(context, cursor)
        }
        is DispatchResult.NonRetryableFailure, DispatchResult.PayloadTooLarge -> {
          ObservePreferences.setLastDispatchedLogId(context, highestId)
          break
        }
        is DispatchResult.RetryableFailure -> break
      }
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
    // TODO(@ubax): Move sessionManager.cleanupOldSessions out of eas observe
    sessionManager.cleanupOldSessions()
    // Remove the database used by the old pending telemetry queues.
    context.deleteDatabase("eas_observe")
    sessionManager.cleanupOldLogs()
  }

  companion object {
    // Serialize foreground and background dispatches without blocking the other signal.
    private val metricsDispatchMutex = Mutex()
    private val logsDispatchMutex = Mutex()
  }
}
