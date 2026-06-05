package expo.modules.appmetrics

import android.content.Context
import expo.modules.appmetrics.appstartup.AppStartupManager
import expo.modules.appmetrics.logevents.LogEventOptions
import expo.modules.appmetrics.logevents.Severity
import expo.modules.appmetrics.logevents.sanitizeLogEventAttributes
import expo.modules.appmetrics.logevents.validateEventBody
import expo.modules.appmetrics.logevents.validateEventName
import expo.modules.appmetrics.memory.MemoryMetricsManager
import expo.modules.appmetrics.storage.JsLogRecord
import expo.modules.appmetrics.storage.JsMetric
import expo.modules.appmetrics.storage.LogRecord
import expo.modules.appmetrics.storage.Metric
import expo.modules.appmetrics.storage.SessionManager
import expo.modules.appmetrics.storage.SessionMetricInput
import expo.modules.appmetrics.storage.SessionSharedObject
import expo.modules.appmetrics.updates.UpdatesMonitoring
import expo.modules.appmetrics.updates.UpdatesStateEvent
import expo.modules.appmetrics.utils.JsonAny
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.interfaces.constants.ConstantsInterface
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.updatesinterface.UpdatesControllerRegistry
import expo.modules.updatesinterface.UpdatesStateChangeListener
import expo.modules.updatesinterface.UpdatesStateChangeSubscription
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

class AppMetricsModule : Module(), UpdatesStateChangeListener {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  // TODO(@lukmccall): Consider using appContext.backgroundCoroutineScope instead
  private val scope: CoroutineScope
    get() = appContext.modulesQueue

  lateinit var memoryMetricsManager: MemoryMetricsManager
  lateinit var updatesMonitoring: UpdatesMonitoring
  private var subscription: UpdatesStateChangeSubscription? = null
  lateinit var appSessionId: String

  lateinit var appSessionStartTimestamp: String

  private val moduleCreationTimestamp = TimeUtils.getCurrentTimestampInISOFormat()

  lateinit var sessionManager: SessionManager

  // Tracks the in-flight session-row INSERT kicked off in `OnCreate`. `OnDestroy`
  // joins it before stamping `endTimestamp` so the UPDATE doesn't race with the
  // INSERT and silently no-op.
  private var sessionStartJob: Job? = null

  private var didSaveStartupMetrics: Boolean = false

  // Lazy-initialized metadata - created once when first needed
  private val metadata: AppMetadata? by lazy {
    AppMetadataProvider.getAppMetadata(appContext.service<ConstantsInterface>(), context)
  }

  override fun definition() =
    ModuleDefinition {
      Name("ExpoAppMetrics")

      Function("markFirstRender") {
        AppStartupManager.markFirstRender()
      }

      Function("markInteractive") { attributes: MetricAttributes? ->
        AppStartupManager.markInteractive(context, attributes?.routeName, attributes?.params)

        scope.launch {
          saveStartupMetricsIfNotSaved()
        }
      }

      Function("logEvent") { name: String, options: LogEventOptions? ->
        val validatedName = validateEventName(name) ?: return@Function
        val validatedBody = validateEventBody(options?.body)
        val sanitized = sanitizeLogEventAttributes(options?.attributes)
        val severity = options?.severity ?: Severity.INFO

        scope.launch {
          // Attach any pending startup metrics first so the session has them
          // alongside whatever's being logged. The session row itself is
          // already persisted eagerly in `OnCreate`, so this is purely about
          // ordering startup-metric writes ahead of caller-driven log events.
          saveStartupMetricsIfNotSaved()
          // Globals merge happens inside `sessionManager.addLogs` so every
          // persistence path picks them up.
          sessionManager.addLogs(
            listOf(
              LogRecord(
                sessionId = appSessionId,
                timestamp = TimeUtils.getCurrentTimestampInISOFormat(),
                name = validatedName,
                body = validatedBody,
                severity = severity.rawValue,
                attributes = sanitized.attributes?.let { JsonAny.encodeMapToJsonString(it) },
                droppedAttributesCount = sanitized.droppedCount
              )
            ),
            sessionId = appSessionId
          )
        }
      }

      Function("setGlobalAttributes") { attributes: Map<String, Any?>? ->
        GlobalAttributes.set(attributes)
      }

      OnCreate {
        sessionManager = SessionManager(context)

        appSessionId = sessionManager.createSessionId()
        appSessionStartTimestamp = TimeUtils.getProcessStartTimestamp()

        // Persist the session row eagerly so it's visible to readers
        // (`getAllSessions`, `addCustomMetricToSession`, …) before any startup
        // metrics arrive. Older app runs are deactivated in the same coroutine
        // to keep the order well-defined. The `Job` is captured so `OnDestroy`
        // can wait for the INSERT before stamping `endTimestamp`.
        sessionStartJob = scope.launch {
          sessionManager.deactivateAllSessionsBefore(moduleCreationTimestamp)
          sessionManager.startSessionWithIdAt(
            sessionId = appSessionId,
            timestamp = appSessionStartTimestamp,
            metadata = metadata
          )
        }

        memoryMetricsManager = MemoryMetricsManager(
          context = context,
          sessionManager = sessionManager
        )
        updatesMonitoring = UpdatesMonitoring(sessionId = appSessionId)
        updatesMonitoring.patchAppInfoIfNeeded(metadata)
        UpdatesControllerRegistry.controller?.get()?.let { controller ->
          subscription = controller.subscribeToUpdatesStateChanges(this@AppMetricsModule)
        }
      }

      OnActivityEntersBackground {
        scope.launch {
          saveStartupMetricsIfNotSaved()
        }
      }

      OnActivityDestroys {
        subscription?.remove()
      }

      OnDestroy {
        // `modulesQueue` is cancelled immediately after this hook returns, so
        // run the UPDATE on the calling thread to make sure the end timestamp
        // is persisted before teardown. Joining `sessionStartJob` first
        // guarantees the INSERT lands before the UPDATE so the stamp doesn't
        // silently no-op on a missing row.
        runBlocking {
          sessionStartJob?.join()
          sessionManager.stopSession(appSessionId)
        }
      }

      AsyncFunction("getAllSessions") Coroutine { ->
        sessionManager.getAllSessionRows().map { session ->
          SessionSharedObject(
            sessionId = session.id,
            // Android has no `type` column, so every session is reported as
            // "main" — a pre-existing divergence from iOS that mirrors
            // `JsSession.type`. A real type column is future work.
            type = "main",
            startDate = session.startTimestamp,
            // Crash reports are iOS-only (MetricKit); never present on Android.
            hasCrashReport = false,
            appContext = appContext
          )
        }
      }

      AsyncFunction("takeMemoryUsageSnapshotAsync") Coroutine { sessionId: String? ->
        return@Coroutine memoryMetricsManager.takeMemorySnapshot(sessionId)
      }

      AsyncFunction("clearStoredEntries") Coroutine { -> sessionManager.clearAllData() }

      // Synchronous: module functions can't run before `OnCreate` has set
      // `appSessionId`, so the main session is always available. We build it
      // from in-memory state captured at launch rather than hitting storage,
      // so it stays cheap, never returns null, and matches the persisted row.
      // `isActive`/`getEndDate` read the row live, so they reflect the session
      // ending even on an object captured while it was still running.
      Function("getMainSession") {
        SessionSharedObject(
          sessionId = appSessionId,
          type = "main",
          startDate = appSessionStartTimestamp,
          hasCrashReport = false,
          appContext = appContext
        )
      }

      Class("Session", SessionSharedObject::class) {
        // The Android Class component requires a constructor for shared
        // objects; sessions are opened and managed natively, so constructing
        // one from JS is a usage error.
        Constructor { ->
          throw CodedException(
            "Session objects can't be created from JavaScript because sessions are opened and managed natively. " +
              "Get one from AppMetrics.getMainSession() or AppMetrics.getAllSessions() instead."
          )
        }

        Property("id", SessionSharedObject::sessionId)
        Property("type", SessionSharedObject::type)
        Property("startDate", SessionSharedObject::startDate)
        Property("hasCrashReport", SessionSharedObject::hasCrashReport)

        AsyncFunction("isActive") Coroutine { ref: SessionSharedObject ->
          sessionManager.getSessionRow(ref.sessionId)?.isActive ?: true
        }

        AsyncFunction("getEndDate") Coroutine { ref: SessionSharedObject ->
          sessionManager.getSessionRow(ref.sessionId)?.endTimestamp
        }

        AsyncFunction("getMetrics") Coroutine { ref: SessionSharedObject ->
          sessionManager.getMetricsForSession(ref.sessionId).map { JsMetric.fromMetric(it) }
        }

        AsyncFunction("getLogs") Coroutine { ref: SessionSharedObject ->
          sessionManager.getLogsForSession(ref.sessionId).map { JsLogRecord.fromLogRecord(it) }
        }

        // Crash reports are an iOS-only MetricKit feature; stubbed here so the
        // JS API has parity across platforms.
        AsyncFunction("getCrashReport") Coroutine { _: SessionSharedObject ->
          null
        }

        AsyncFunction("addMetric") Coroutine { ref: SessionSharedObject, metric: SessionMetricInput ->
          sessionStartJob?.join()
          sessionManager.addMetrics(listOf(metric.toMetric(ref.sessionId)), sessionId = ref.sessionId)
        }
      }
    }

  fun setEnvironment(environment: String) {
    AppMetricsPreferences.setEnvironment(context, environment)
    scope.launch {
      sessionManager.updateEnvironmentForActiveSessions(environment)
    }
  }

  override fun updatesStateDidChange(event: Map<String, Any>) {
    if (UpdatesStateEvent.fromMap(event)?.type == UpdatesStateEvent.EventType.DownloadCompleteWithUpdate) {
      updatesMonitoring.downloadTimeMetric(subscription)?.let { metric ->
        scope.launch {
          // Attach any pending startup metrics first so the download-time
          // metric lands alongside them. The session row itself is already
          // persisted eagerly in `OnCreate`.
          saveStartupMetricsIfNotSaved()
          sessionManager.addMetrics(listOf(metric), sessionId = appSessionId)
        }
      }
    }
  }

  // TODO(@lukmccall): Potential race condition - multiple coroutines could enter the block simultaneously, causing duplicates.
  internal suspend fun saveStartupMetricsIfNotSaved() {
    if (!didSaveStartupMetrics) {
      // The session row is written eagerly in `OnCreate`, so we only need to
      // attach the startup metrics here once they've been collected.
      sessionManager.addMetrics(AppStartupManager.metrics, sessionId = appSessionId)
      didSaveStartupMetrics = true
    }
  }
}

@OptimizedRecord
data class MetricAttributes(
  @Field val routeName: String? = null,
  @Field val params: Map<String, Any>? = null
) : Record
