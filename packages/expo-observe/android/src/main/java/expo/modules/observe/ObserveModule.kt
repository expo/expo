package expo.modules.observe

import android.content.Context
import android.util.Log
import expo.modules.appmetrics.AppMetricsModule
import expo.modules.appmetrics.ObserveConsent
import expo.modules.easclient.EASClientID
import expo.modules.interfaces.constants.ConstantsInterface
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord
import kotlinx.coroutines.CancellationException

@OptimizedRecord
class Config(
  @Field val environment: String? = null,
  @Field val dispatchingEnabled: Boolean? = null,
  @Field val dispatchInDebug: Boolean? = null,
  @Field val sampleRate: Double? = null,
  @Field val errorSampleRate: Double? = null,
  @Field val ignoredMetrics: List<String> = emptyList(),
  @Field val ignoredEvents: List<String> = emptyList(),
  @Field val integrations: Map<String, Any?>? = null
) : Record

@OptimizedRecord
class BundleDefaults(
  @Field val environment: String = "",
  @Field val isJsDev: Boolean = false
) : Record

internal enum class ConsentValue(val value: String) : Enumerable {
  GRANTED("granted"),
  NOT_GRANTED("not-granted")
}

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
        // Deletes what a build with consent stored. Module start is late enough, because nothing is
        // sent without consent.
        if (!ObserveConsent.isGranted) {
          context.deleteDatabase(LEGACY_DATABASE_NAME)
          ObservePreferences.deleteStoredSettings(context)
        }
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

      Constant("clientId") {
        EASClientID(context).uuid.toString().lowercase()
      }

      AsyncFunction("setConsent") Coroutine { consent: ConsentValue ->
        applyConsent(context, consent, appMetricsModule::setConsent)
      }

      AsyncFunction("dispatchEvents") Coroutine { ->
        observabilityManager.dispatchUnsentMetrics()
        observabilityManager.dispatchUnsentLogs()
        observabilityManager.dispatchUnsentSpans()
      }

      Function("configure") { config: Config ->
        ObservePreferences.setConfig(
          context,
          PersistedConfig(
            dispatchingEnabled = config.dispatchingEnabled,
            dispatchInDebug = config.dispatchInDebug,
            sampleRate = config.sampleRate,
            errorSampleRate = config.errorSampleRate,
            ignoredMetrics = config.ignoredMetrics,
            ignoredEvents = config.ignoredEvents
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

/**
 * Applies `Observe.setConsent`. A revoke deletes the Observe data under the app metrics consent
 * lock, after the gate closes, also when the consent save failed. A failed consent save is reported
 * before a failed delete.
 */
internal suspend fun applyConsent(
  context: Context,
  consent: ConsentValue,
  setAppMetricsConsent: suspend (Boolean, suspend () -> Unit) -> Unit
) {
  var deleteError: Exception? = null
  try {
    setAppMetricsConsent(consent == ConsentValue.GRANTED) {
      try {
        deleteObserveData(context)
      } catch (e: CancellationException) {
        throw e
      } catch (e: Exception) {
        deleteError = e
      }
    }
  } catch (e: CancellationException) {
    throw e
  } catch (e: Exception) {
    deleteError?.let(e::addSuppressed)
    throw e
  }
  deleteError?.let { throw it }
}

/** Deletes the Observe settings, the dispatch cursors among them, and the scheduled dispatch. */
internal suspend fun deleteObserveData(context: Context) {
  // The local deletes first, because they do not suspend. So a failed or canceled dispatch cancel
  // cannot skip them.
  try {
    context.deleteDatabase(LEGACY_DATABASE_NAME)
  } finally {
    ObservePreferences.deleteStoredSettings(context)
  }
  ObservabilityBackgroundWorker.cancelBackgroundDispatch(context)
}
