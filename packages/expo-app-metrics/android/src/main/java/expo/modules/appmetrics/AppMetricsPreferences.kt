package expo.modules.appmetrics

import android.content.Context
import androidx.core.content.edit
import expo.modules.appmetrics.networkrequests.NetworkTracesConfiguration

private const val PREFS_NAME = "dev.expo.app-metrics"
private const val KEY_ENVIRONMENT = "environment"
private const val KEY_LAST_PROCESSED_EXIT_MILLIS = "lastProcessedExitMillis"
private const val KEY_NETWORK_TRACES_CONFIGURATION = "networkTracesConfiguration"
private const val KEY_OBSERVE_CONSENT = "observeConsent"

object AppMetricsPreferences {
  private val preferences = ConsentGatedPreferences(PREFS_NAME)

  /**
   * Timestamp (epoch millis) of the newest `ApplicationExitInfo` record already
   * turned into a crash report. `0` (the default) means none processed yet.
   */
  fun getLastProcessedExitTimestampMillis(context: Context): Long =
    preferences.getLong(context, KEY_LAST_PROCESSED_EXIT_MILLIS, 0L)

  fun setLastProcessedExitTimestampMillis(
    context: Context,
    millis: Long
  ) {
    preferences.putLong(context, KEY_LAST_PROCESSED_EXIT_MILLIS, millis)
  }

  fun getEnvironment(context: Context): String? =
    preferences.getString(context, KEY_ENVIRONMENT) ?: getDefaultEnvironment()

  fun setEnvironment(
    context: Context,
    environment: String
  ) {
    preferences.putString(context, KEY_ENVIRONMENT, environment)
  }

  fun getDefaultEnvironment(): String? {
    return if (BuildConfig.DEBUG) {
      "development"
    } else {
      null
    }
  }

  /**
   * Last-applied network traces recording policy, or the default when JS never configured one.
   * Persisted so requests observed before the JS bundle configures the SDK (early startup, or
   * the next launch) follow the last-known setting.
   */
  fun getNetworkTracesConfiguration(context: Context): NetworkTracesConfiguration {
    val json = preferences.getString(context, KEY_NETWORK_TRACES_CONFIGURATION)
      ?: return NetworkTracesConfiguration()
    return NetworkTracesConfiguration.fromJson(json)
  }

  fun setNetworkTracesConfiguration(
    context: Context,
    configuration: NetworkTracesConfiguration
  ) {
    // `apply()` rather than `commit()`: this runs inline on the JS thread, and iOS persists
    // through `UserDefaults` without a synchronous flush either.
    preferences.putString(context, KEY_NETWORK_TRACES_CONFIGURATION, configuration.toJson(), commit = false)
  }

  // Keeps the saved consent value.
  internal fun deleteStoredSettings(context: Context) {
    val consent = getObserveConsent(context) ?: return preferences.delete(context)
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit(commit = true) {
      clear()
      putString(KEY_OBSERVE_CONSENT, consent)
    }
  }

  /** The saved consent value. `null` when no value was saved. */
  internal fun getObserveConsent(context: Context): String? =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getString(KEY_OBSERVE_CONSENT, null)

  /** Returns whether the value was written to disk. */
  internal fun setObserveConsent(context: Context, consent: String): Boolean =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit().putString(KEY_OBSERVE_CONSENT, consent).commit()
}
