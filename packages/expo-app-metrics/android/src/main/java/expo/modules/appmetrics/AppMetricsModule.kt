package expo.modules.appmetrics

import android.content.Context
import android.util.Log
import expo.modules.appmetrics.appstartup.AppStartupManager
import expo.modules.appmetrics.logevents.LogEventOptions
import expo.modules.appmetrics.logevents.makeLogRecord
import expo.modules.appmetrics.networkrequests.NetworkRequestFilter
import expo.modules.appmetrics.networkrequests.NetworkRequestObserver
import expo.modules.appmetrics.storage.JsDebugSession
import expo.modules.appmetrics.storage.JsLogRecord
import expo.modules.appmetrics.storage.JsMetric
import expo.modules.appmetrics.storage.LogRecord
import expo.modules.appmetrics.storage.Metric
import expo.modules.appmetrics.storage.SessionManager
import expo.modules.appmetrics.storage.SessionMetricInput
import expo.modules.appmetrics.storage.SessionSharedObject
import expo.modules.appmetrics.updates.UpdatesMonitoring
import expo.modules.appmetrics.updates.UpdatesStateEvent
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

  lateinit var updatesMonitoring: UpdatesMonitoring
  private var subscription: UpdatesStateChangeSubscription? = null

  lateinit var sessionManager: SessionManager

  lateinit var mainSession: SessionSharedObject

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

      // Convenience wrapper that records against the main session. Validation and record building
      // happen in `makeLogRecord`; the session only persists, stamping its own id in `addLogs`.
      Function("logEvent") { name: String, options: LogEventOptions? ->
        val record = makeLogRecord(name, options) ?: return@Function

        scope.launch {
          // Attach any pending startup metrics first so the session has them
          // alongside whatever's being logged. The session row itself is
          // already persisted eagerly in `OnCreate`, so this is purely about
          // ordering startup-metric writes ahead of caller-driven log events.
          saveStartupMetricsIfNotSaved()
          // Globals merge happens inside `sessionManager.addLogs` so every
          // persistence path picks them up. The session waits for its row
          // before inserting.
          mainSession.addLogs(listOf(record))
        }
      }

      Function("setGlobalAttributes") { attributes: Map<String, Any?>? ->
        GlobalAttributes.set(attributes)
      }

      OnCreate {
        sessionManager = SessionManager(context)

        // The main session starts at the first startup metric's timestamp (the
        // earliest moment we have a record of), falling back to now when none
        // have been collected yet.
        val appSessionStartTimestamp =
          AppStartupManager.metrics.firstOrNull()?.timestamp ?: TimeUtils.getCurrentTimestampInISOFormat()

        mainSession = SessionSharedObject(
          sessionManager = sessionManager,
          scope = scope,
          type = "main",
          customStartTimestamp = appSessionStartTimestamp,
          metadata = metadata,
          runtime = appContext.runtime
        )

        // Persist the session row eagerly so it's visible to readers
        // (`getMainSession`, …) as soon as possible. Idempotent:
        // a racing write triggers (and joins) the same single start job.
        scope.launch { mainSession.awaitSessionPersisted() }

        // Sweep sessions orphaned by a previous process. The cutoff equals this
        // session's start and the comparison is strict (`<`), so this session
        // survives while older ones are swept — order vs the INSERT doesn't
        // matter. Relies on `<`, not `<=` (see SessionManagerTest).
        scope.launch { sessionManager.deactivateAllSessionsBefore(appSessionStartTimestamp) }

        updatesMonitoring = UpdatesMonitoring()
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
        // is persisted before teardown. `stop` awaits the session-start job
        // first, so the INSERT lands before the UPDATE and the stamp doesn't
        // silently no-op on a missing row.
        runBlocking {
          mainSession.stop()
        }
      }

      // Debug-only: surfaces the inactive (ended) sessions for on-device
      // inspection (e.g. the ObserveTester app)
      AsyncFunction("getInactiveSessions") Coroutine { ->
        sessionManager.getInactiveSessions().map { JsDebugSession.fromSessionWithMetrics(it) }
      }

      AsyncFunction("clearStoredEntries") Coroutine { -> sessionManager.clearAllData() }

      Function("getMainSession") {
        mainSession
      }

      // Android has no foreground-session tracking yet, so there's never a session to return.
      // Async to match the `Promise<Session | null>` JS contract.
      AsyncFunction("getForegroundSession") {
        null as SessionSharedObject?
      }

      Class(NetworkRequestObserver::class) {
        Constructor { filter: NetworkRequestFilter? ->
          NetworkRequestObserver(appContext, filter)
        }

        Function("setFilter") { observer: NetworkRequestObserver, filter: NetworkRequestFilter? ->
          observer.setFilter(filter)
        }
      }

      Class("Session", SessionSharedObject::class) {
        // TODO(@ubax): Allow for user session creation from JS
        Constructor { ->
          throw CodedException(
            "Session objects can't be created from JavaScript because sessions are opened and managed natively. " +
              "Get one from AppMetrics.getMainSession() or AppMetrics.getForegroundSession() instead."
          )
        }

        Property("id", SessionSharedObject::sessionId)
        Property("type", SessionSharedObject::type)
        Property("startDate", SessionSharedObject::startDate)

        AsyncFunction("isActive") Coroutine SessionSharedObject::isActive
        AsyncFunction("getEndDate") Coroutine SessionSharedObject::getEndDate

        AsyncFunction("getMetrics") Coroutine { ref: SessionSharedObject ->
          ref.getMetrics().map { JsMetric.fromMetric(it) }
        }

        AsyncFunction("getLogs") Coroutine { ref: SessionSharedObject ->
          ref.getLogs().map { JsLogRecord.fromLogRecord(it) }
        }

        AsyncFunction("addMetric") Coroutine { ref: SessionSharedObject, metric: SessionMetricInput ->
          // `addMetrics` stamps the session id, so the input doesn't carry one.
          ref.addMetrics(listOf(metric.toMetric()))
        }

        // Builds the record here (like the module-level `logEvent`) and lets the session persist it
        // under its own id via `addLogs`. Invalid events are dropped without persisting. Best-effort:
        // a failed insert is logged and swallowed so logging never rejects the caller's promise
        // (matching iOS). Startup metrics aren't flushed here — that's a main-session concern handled
        // by the module-level `logEvent` and lifecycle hooks, not a per-session log write.
        AsyncFunction("logEvent") Coroutine { ref: SessionSharedObject, name: String, options: LogEventOptions? ->
          val record = makeLogRecord(name, options) ?: return@Coroutine
          try {
            ref.addLogs(listOf(record))
          } catch (e: Exception) {
            Log.w(TAG, "[AppMetrics] Failed to record log event \"${record.name}\"", e)
          }
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
          // metric lands alongside them. The session waits for its row before
          // inserting.
          saveStartupMetricsIfNotSaved()
          mainSession.addMetrics(listOf(metric))
        }
      }
    }
  }

  // Persists the collected startup metrics once, then suspends until that write
  // completes. The session waits for its row before inserting.
  internal suspend fun saveStartupMetricsIfNotSaved() = saveStartupMetricsJob.join()

  // Startup metrics are persisted on first access and exactly once: `by lazy`
  // runs the initializer a single time even across threads, so concurrent callers
  // don't each insert them.
  private val saveStartupMetricsJob: Job by lazy {
    scope.launch {
      mainSession.addMetrics(AppStartupManager.metrics)
    }
  }
}

@OptimizedRecord
data class MetricAttributes(
  @Field val routeName: String? = null,
  @Field val params: Map<String, Any>? = null
) : Record
