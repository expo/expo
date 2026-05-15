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
import expo.modules.appmetrics.storage.SessionManager
import expo.modules.appmetrics.storage.SessionSharedObject
import expo.modules.appmetrics.updates.UpdatesMonitoring
import expo.modules.appmetrics.updates.UpdatesStateEvent
import expo.modules.appmetrics.utils.JsonAny
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.interfaces.constants.ConstantsInterface
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
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

      OnCreate {
        sessionManager = SessionManager(context)

        appSessionId = sessionManager.createSessionId()

        // Persist the session row eagerly so it's visible to readers
        // (`getAllSessions`, `Session.addMetric`, …) before any startup
        // metrics arrive. Older app runs are deactivated in the same coroutine
        // to keep the order well-defined. The `Job` is captured so `OnDestroy`
        // can wait for the INSERT before stamping `endTimestamp`.
        sessionStartJob = scope.launch {
          sessionManager.deactivateAllSessionsBefore(moduleCreationTimestamp)
          sessionManager.startSessionWithIdAt(
            sessionId = appSessionId,
            timestamp = TimeUtils.getProcessStartTimestamp(),
            type = "main",
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
        sessionManager.getAllSessionMetadata().map { row ->
          SessionSharedObject(
            appContext = appContext,
            id = row.id,
            type = row.type,
            startDate = row.startTimestamp,
            endDate = row.endTimestamp,
            sessionManager = sessionManager
          )
        }
      }

      AsyncFunction("takeMemoryUsageSnapshotAsync") Coroutine { sessionId: String? ->
        return@Coroutine memoryMetricsManager.takeMemorySnapshot(sessionId)
      }

      AsyncFunction("clearStoredEntries") Coroutine { -> sessionManager.clearAllData() }

      AsyncFunction("getMainSession") Coroutine { ->
        sessionManager.getSessionMetadata(appSessionId)?.let { row ->
          SessionSharedObject(
            appContext = appContext,
            id = row.id,
            type = row.type,
            startDate = row.startTimestamp,
            endDate = row.endTimestamp,
            sessionManager = sessionManager
          )
        }
      }

      // JS-bridge class name is "Session" so `instanceof ExpoAppMetrics.Session`
      // works as expected. `Metric` / `LogRecord` Room entities returned from
      // `SessionManager` are mapped to their JS-facing shapes here, at the
      // module boundary, so the storage layer doesn't depend on bridge types.
      Class("Session", SessionSharedObject::class) {
        // The Android Expo Modules runtime requires every `SharedObject` class
        // to declare a `Constructor`. `Session` instances are only ever handed
        // out by `getMainSession` / `getAllSessions`, so this constructor
        // throws to make a direct `new ExpoAppMetrics.Session()` from JS fail
        // loudly instead of producing a half-initialized handle.
        Constructor { ->
          throw IllegalArgumentException("Session cannot be constructed directly. Use ExpoAppMetrics.getMainSession() or ExpoAppMetrics.getAllSessions() instead.")
        }

        Property("id") { ref: SessionSharedObject -> ref.id }
        Property("type") { ref: SessionSharedObject -> ref.type }
        Property("startDate") { ref: SessionSharedObject -> ref.startDate }
        Property("endDate") { ref: SessionSharedObject -> ref.endDate }

        AsyncFunction("getMetrics") Coroutine { ref: SessionSharedObject ->
          ref.sessionManager.getMetricsForSession(ref.id).map(JsMetric::fromMetric)
        }
        AsyncFunction("getLogs") Coroutine { ref: SessionSharedObject ->
          ref.sessionManager.getLogsForSession(ref.id).map(JsLogRecord::fromLogRecord)
        }
        AsyncFunction("addMetric") Coroutine { ref: SessionSharedObject, metric: JsMetric ->
          // Throws if the underlying session row has been pruned by retention
          // cleanup — JS sees a rejected Promise instead of a silent drop. See
          // the `Session` JSDoc for the lifetime contract.
          ref.sessionManager.addMetricToSession(metric.toMetric(), sessionId = ref.id)
        }
        // TODO: surface the real crash report on the main session once Android
        // crash reporting lands. Until then this is always `null`, matching
        // the iOS contract for non-main sessions. Typed as a `Map` so the
        // bridge serializes today's `null` the same way it'll serialize a
        // real report payload later.
        AsyncFunction("getCrashReport") Coroutine { _: SessionSharedObject ->
          null as Map<String, Any?>?
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

data class MetricAttributes(
  @Field val routeName: String? = null,
  @Field val params: Map<String, Any>? = null
) : Record
