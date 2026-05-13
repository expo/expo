package expo.modules.observe

import android.content.Context
import android.util.Log
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

class BundleDefaults(
  @Field val environment: String = "",
  @Field val isJsDev: Boolean = false
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

      AsyncFunction("dispatchEvents") Coroutine { ->
        observabilityManager.dispatchUnsentMetrics()
        observabilityManager.dispatchUnsentLogs()
      }

      Function("configure") { config: Config ->
        ObservePreferences.setConfig(
          context,
          PersistedConfig(
            dispatchingEnabled = config.dispatchingEnabled,
            dispatchInDebug = config.dispatchInDebug,
            sampleRate = config.sampleRate
          )
        )
        // Environment falls back to the bundle default (set on JS package import) so an
        // omitted field becomes a deterministic value, not a silent retain of prior state.
        val resolvedEnvironment = config.environment
          ?: ObservePreferences.getBundleDefaults(context)?.environment
        resolvedEnvironment?.let { appMetricsModule.setEnvironment(it) }
      }

      Function("setBundleDefaults") { defaults: BundleDefaults ->
        // Empty environment means JS bypassed both `process.env.NODE_ENV` and the
        // `?? 'production'` fallback. Refuse rather than persist an empty string,
        // which would silently corrupt downstream metrics.
        if (defaults.environment.isEmpty()) {
          Log.w(
            OBSERVE_TAG,
            "setBundleDefaults received empty environment; skipping. " +
              "This is a bug in the JS layer — process.env.NODE_ENV should always resolve."
          )
          return@Function
        }
        ObservePreferences.setBundleDefaults(
          context,
          PersistedBundleDefaults(environment = defaults.environment, isJsDev = defaults.isJsDev)
        )
        appMetricsModule.setEnvironment(defaults.environment)
      }
    }
}
