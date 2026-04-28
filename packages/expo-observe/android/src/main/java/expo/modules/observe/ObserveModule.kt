package expo.modules.observe

import android.content.Context
import expo.modules.appmetrics.AppMetricsModule
import expo.modules.interfaces.constants.ConstantsInterface
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class Config(
  @Field val environment: String? = null,
  @Field val dispatchingEnabled: Boolean? = null,
  @Field val dispatchInDebug: Boolean? = null,
  @Field val sampleRate: Double? = null
) : Record

class ObserveModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private lateinit var observabilityManager: ObservabilityManager
  private lateinit var appMetricsModule: AppMetricsModule

  override fun definition() =
    ModuleDefinition {
      Name("ExpoObserve")

      OnCreate {
        appMetricsModule = checkNotNull(appContext.registry.getModule<AppMetricsModule>()) {
          "AppMetricsModule is required by ObserveModule. Make sure expo-app-metrics is installed."
        }
        val sessionManager = appMetricsModule.sessionManager
        observabilityManager = ObservabilityManager(
          context,
          appContext.service<ConstantsInterface>(),
          sessionManager = sessionManager
        )
      }

      OnActivityEntersBackground {
        observabilityManager.scheduleBackgroundDispatch()
      }

      AsyncFunction("dispatchEvents") Coroutine { -> observabilityManager.dispatchUnsentMetrics() }

      Function("configure") { config: Config ->
        ObservePreferences.setConfig(
          context,
          PersistedConfig(
            dispatchingEnabled = config.dispatchingEnabled,
            dispatchInDebug = config.dispatchInDebug,
            sampleRate = config.sampleRate
          )
        )
        config.environment?.let { appMetricsModule.setEnvironment(it) }
      }
    }
}
