package expo.modules.appmetrics

import android.content.Context
import expo.modules.appmetrics.appstartup.AppStartupManager
import expo.modules.appmetrics.memory.MemoryMetricsManager
import expo.modules.appmetrics.storage.JsSession
import expo.modules.appmetrics.storage.Metric
import expo.modules.appmetrics.storage.SessionManager
import expo.modules.appmetrics.updates.UpdatesMonitoring
import expo.modules.appmetrics.updates.UpdatesStateEvent
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
import kotlinx.serialization.json.Json

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

      OnCreate {
        sessionManager = SessionManager(context)

        appSessionId = sessionManager.createSessionId()

        // Persist the session row eagerly so it's visible to readers
        // (`getAllSessions`, `addCustomMetricToSession`, …) before any startup
        // metrics arrive. Older app runs are deactivated in the same coroutine
        // to keep the order well-defined. The `Job` is captured so `OnDestroy`
        // can wait for the INSERT before stamping `endTimestamp`.
        sessionStartJob = scope.launch {
          sessionManager.deactivateAllSessionsBefore(moduleCreationTimestamp)
          sessionManager.startSessionWithIdAt(
            sessionId = appSessionId,
            timestamp = TimeUtils.getProcessStartTimestamp(),
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

      AsyncFunction("getStoredEntries") Coroutine { -> sessionManager.getAllSessions() }

      AsyncFunction("getAllSessions") Coroutine { ->
        sessionManager.getAllSessions().map { JsSession.fromSessionWithMetrics(it) }
      }

      AsyncFunction("takeMemoryUsageSnapshotAsync") Coroutine { sessionId: String? ->
        return@Coroutine memoryMetricsManager.takeMemorySnapshot(sessionId)
      }

      AsyncFunction("clearStoredEntries") Coroutine { -> sessionManager.clearAllData() }

      Function("startSession") {
        val sessionId = sessionManager.createSessionId()
        val timestamp = TimeUtils.getCurrentTimestampInISOFormat()
        val sessionMetadata = metadata

        scope.launch {
          sessionManager.startSessionWithIdAt(
            sessionId = sessionId,
            timestamp = timestamp,
            metadata = sessionMetadata
          )
        }

        return@Function sessionId
      }

      Function("stopSession") { sessionId: String ->
        scope.launch {
          sessionManager.stopSession(sessionId = sessionId)
        }
      }

      AsyncFunction("addCustomMetricToSession") Coroutine { sessionId: String, metric: PartialMetric ->
        sessionManager.addMetrics(listOf(metric.toMetric(sessionId)), sessionId = sessionId)
      }

      AsyncFunction("getMainSession") Coroutine { ->
        sessionManager.getSessionById(appSessionId)?.let { JsSession.fromSessionWithMetrics(it) }
      }
    }

  fun setEnvironment(environment: String) {
    AppMetricsPreferences.setEnvironment(context, environment)
    scope.launch {
      sessionManager.updateEnvironmentForActiveSessions(environment)
    }
  }

  fun getEnvironment(): String? {
    return AppMetricsPreferences.getEnvironment(context)
  }

  override fun updatesStateDidChange(event: Map<String, Any>) {
    if (UpdatesStateEvent.fromMap(event)?.type == UpdatesStateEvent.EventType.DownloadCompleteWithUpdate) {
      updatesMonitoring.downloadTimeMetric(subscription)?.let { metric ->
        scope.launch {
          // Ensure the session row exists before inserting the metric,
          // since the session may not have been saved yet if the download
          // completes before markInteractive or app backgrounding.
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

data class PartialMetric(
  @Field val category: String,
  @Field val name: String,
  @Field val value: Double,
  @Field val routeName: String? = null,
  @Field val params: Map<String, Any>? = null
) : Record {
  fun toMetric(sessionId: String): Metric =
    Metric(
      sessionId = sessionId,
      timestamp = TimeUtils.getCurrentTimestampInISOFormat(),
      category = category,
      name = name,
      value = value,
      routeName = routeName,
      params = params?.let { Json.encodeToString(it) }
    )
}

data class MetricAttributes(
  @Field val routeName: String? = null,
  @Field val params: Map<String, Any>? = null
) : Record
