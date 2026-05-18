package expo.modules.observe

import android.content.Context
import expo.modules.easclient.EASClientID
import expo.modules.observe.storage.PendingLogsManager
import expo.modules.observe.storage.PendingMetricsManager
import expo.modules.appmetrics.storage.SessionManager
import expo.modules.interfaces.constants.ConstantsInterface

class ObservabilityManager(
  // TODO(@lukmccall): Consider saving context as weak reference to avoid potential memory leaks
  private val context: Context,
  constants: ConstantsInterface?,
  val sessionManager: SessionManager
) {
  private val baseManager: BaseObservabilityManager
  private val useOpenTelemetry: Boolean

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
    useOpenTelemetry = manifest.useOpenTelemetry

    val pendingMetricsManager = PendingMetricsManager(context)
    val pendingLogsManager = PendingLogsManager(context)

    baseManager = BaseObservabilityManager(
      context = context,
      sessionManager = sessionManager,
      pendingMetricsManager = pendingMetricsManager,
      pendingLogsManager = pendingLogsManager,
      projectId = projectId,
      baseUrl = baseUrl,
      isDebugBuild = BuildConfig.DEBUG,
      useOpenTelemetry = useOpenTelemetry
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
      baseUrl = baseManager.baseUrl,
      useOpenTelemetry = useOpenTelemetry
    )
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
  private val useOpenTelemetry: Boolean = false,
  private val deterministicUniformValueProvider: () -> Double = {
    EASClientID.deterministicUniformValue(EASClientID(context).uuid)
  }
) {
  private val eventDispatcher = EventDispatcher(
    context = context,
    projectId = projectId,
    baseUrl = baseUrl,
    useOpenTelemetry = useOpenTelemetry
  )

  suspend fun dispatchUnsentMetrics() {
    val pendingIds = pendingMetricsManager.getAllPendingMetricIds()
    if (pendingIds.isEmpty()) {
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

    if (eventDispatcher.dispatch(events)) {
      val dispatchedMetricIds = sessionsWithPendingMetrics.flatMap { it.metrics }.map { it.metricId }
      pendingMetricsManager.removePendingMetrics(dispatchedMetricIds)
    }
  }

  /**
   * Dispatches log events to `/v1/logs`. Independent from the metrics path —
   * a logs failure doesn't affect the metrics pending table and vice versa.
   */
  suspend fun dispatchUnsentLogs() {
    val pendingIds = pendingLogsManager.getAllPendingLogIds()
    if (pendingIds.isEmpty()) {
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

    if (eventDispatcher.dispatchLogs(events)) {
      val dispatchedLogIds = sessionsWithPendingLogs.flatMap { it.logs }.map { it.logId }
      pendingLogsManager.removePendingLogs(dispatchedLogIds)
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
