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
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
class Config(
  @Field val environment: String? = null,
  @Field val dispatchingEnabled: Boolean? = null,
  @Field val dispatchInDebug: Boolean? = null,
  @Field val sampleRate: Double? = null,
  @Field val integrations: Map<String, Any?>? = null
  @Field val scheduledDispatchInterval: Double? = null
  @Field val scheduledDispatchPollingInterval: Double? = null,
  @Field val scheduledDispatchDelay: Double? = null
) : Record

@OptimizedRecord
class BundleDefaults(
  @Field val environment: String = "",
  @Field val isJsDev: Boolean = false
) : Record

class ObserveModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private lateinit var observabilityManager: ObservabilityManager
  private lateinit var appMetricsModule: AppMetricsModule

  private var lastIntegrations: Map<String, Any?> = emptyMap()

  override fun definition() =
    ModuleDefinition {
      Name("ExpoObserve")

      Events("configure")

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
            sampleRate = config.sampleRate,
            scheduledDispatchPollingInterval = config.scheduledDispatchPollingInterval,
            scheduledDispatchDelay = config.scheduledDispatchDelay
          )
        )
        // Environment falls back to the bundle default (set on JS package import) so an
        // omitted field becomes a deterministic value, not a silent retain of prior state.
        val resolvedEnvironment = config.environment
          ?: ObservePreferences.getBundleDefaults(context)?.environment
        resolvedEnvironment?.let { appMetricsModule.setEnvironment(it) }

        // Broadcast the integrations config so integration libraries (e.g. expo-image) can activate.
        lastIntegrations = config.integrations ?: emptyMap()
        this@ObserveModule.sendEvent("configure", mapOf("integrations" to lastIntegrations))

        // The JS surface speaks Double seconds; native loops want Long seconds. `null`/`0` keep
        // the loop idle; any positive value starts or updates it.
        observabilityManager.setPollingIntervalSeconds(config.scheduledDispatchPollingInterval?.toLong())
        observabilityManager.setDeferredDispatchDelaySeconds(config.scheduledDispatchDelay?.toLong())
      }

      Function("getIntegrations") {
        lastIntegrations
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
