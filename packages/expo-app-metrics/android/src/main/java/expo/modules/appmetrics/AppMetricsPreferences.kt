package expo.modules.appmetrics

import android.content.Context
import androidx.core.content.edit
import expo.modules.appmetrics.networkrequests.NetworkSpansConfiguration

private const val PREFS_NAME = "dev.expo.app-metrics"
private const val KEY_ENVIRONMENT = "environment"
private const val KEY_LAST_PROCESSED_EXIT_MILLIS = "lastProcessedExitMillis"
private const val KEY_NETWORK_SPANS_CONFIGURATION = "networkSpansConfiguration"

object AppMetricsPreferences {
  /**
   * Timestamp (epoch millis) of the newest `ApplicationExitInfo` record already
   * turned into a crash report. `0` (the default) means none processed yet.
   */
  fun getLastProcessedExitTimestampMillis(context: Context): Long {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    return prefs.getLong(KEY_LAST_PROCESSED_EXIT_MILLIS, 0L)
  }

  fun setLastProcessedExitTimestampMillis(
    context: Context,
    millis: Long
  ) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    prefs.edit(commit = true) { putLong(KEY_LAST_PROCESSED_EXIT_MILLIS, millis) }
  }

  fun getEnvironment(context: Context): String? {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    return prefs.getString(KEY_ENVIRONMENT, null) ?: getDefaultEnvironment()
  }

  fun setEnvironment(
    context: Context,
    environment: String
  ) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    prefs.edit(commit = true) { putString(KEY_ENVIRONMENT, environment) }
  }

  fun getDefaultEnvironment(): String? {
    return if (BuildConfig.DEBUG) "development" else null
  }

  /**
   * Last-applied network spans recording policy, or the default when JS never configured one.
   * Persisted so requests observed before the JS bundle configures the SDK — early startup, or
   * the next launch — follow the last-known setting.
   */
  fun getNetworkSpansConfiguration(context: Context): NetworkSpansConfiguration {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val json = prefs.getString(KEY_NETWORK_SPANS_CONFIGURATION, null)
      ?: return NetworkSpansConfiguration()
    return NetworkSpansConfiguration.fromJson(json)
  }

  fun setNetworkSpansConfiguration(
    context: Context,
    configuration: NetworkSpansConfiguration
  ) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    prefs.edit(commit = true) { putString(KEY_NETWORK_SPANS_CONFIGURATION, configuration.toJson()) }
  }
}
