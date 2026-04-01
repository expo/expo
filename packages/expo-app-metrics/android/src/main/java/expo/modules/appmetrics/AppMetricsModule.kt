package expo.modules.appmetrics

import android.content.Context
import expo.modules.appmetrics.appstartup.AppStartupManager
import expo.modules.appmetrics.memory.MemoryMetricsManager
import expo.modules.appmetrics.storage.Metric
import expo.modules.appmetrics.storage.SessionManager
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.interfaces.constants.ConstantsInterface
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.serialization.json.Json

class AppMetricsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  // TODO(@lukmccall): Consider using appContext.backgroundCoroutineScope instead
  private val scope: CoroutineScope
    get() = appContext.modulesQueue

  // lateinit var frameMetricsManager: FrameMetricsManager
  lateinit var memoryMetricsManager: MemoryMetricsManager
  lateinit var appSessionId: String

  private val moduleCreationTimestamp = TimeUtils.getCurrentTimestampInISOFormat()

  lateinit var sessionManager: SessionManager

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

      Function("markInteractive") { routeName: String? ->
        AppStartupManager.markInteractive(routeName)

        scope.launch {
          saveStartupMetricsIfNotSaved()
        }
      }

      OnCreate {
        sessionManager = SessionManager(context)

        // Deactivate all sessions from previous app runs
        scope.launch {
          sessionManager.deactivateAllSessionsBefore(moduleCreationTimestamp)
        }

        appSessionId = sessionManager.createSessionId()
        memoryMetricsManager = MemoryMetricsManager(
          context = context,
          sessionManager = sessionManager
        )
        // appContext.currentActivity?.let {
        //   frameMetricsManager = FrameMetricsManager(
        //     activity = it,
        //     sessionManager = sessionManager
        //   )
        // }
      }

      OnActivityEntersForeground {
        // If the activity was not available during OnCreate, we can get it here
        // if (!::frameMetricsManager.isInitialized) {
        //   appContext.currentActivity?.let {
        //     frameMetricsManager = FrameMetricsManager(
        //       activity = it,
        //       sessionManager = sessionManager
        //     )
        //   }
        // }

        // frameMetricsManager.startRecording(sessionId = appSessionId)
      }

      OnActivityEntersBackground {
        scope.launch {
          saveStartupMetricsIfNotSaved()
          // frameMetricsManager.stopRecording(sessionId = appSessionId)
        }
      }

      OnActivityDestroys {
        // TODO(@lukmccall): Don't use modules queue scope for cleaning as it might be cancelled by AppContext.
        scope.launch {
          // frameMetricsManager.stopAllRecordings()
        }
      }

      AsyncFunction("getStoredEntries") Coroutine { -> sessionManager.getAllSessions() }

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

  // TODO(@lukmccall): Potential race condition - multiple coroutines could enter the block simultaneously, causing duplicates.
  internal suspend fun saveStartupMetricsIfNotSaved() {
    if (!didSaveStartupMetrics) {
      // This function should be called, after all startup events are collected
      // This seems to be the best place right now, because it will not slow down the app startup
      sessionManager.startSessionWithIdAndMetricsAt(
        id = appSessionId,
        timestamp = TimeUtils.getProcessStartTimestamp(),
        metrics = AppStartupManager.metrics,
        metadata = metadata
      )
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
