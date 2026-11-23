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

  // Keeps the consent value, the one value saved without consent.
  internal fun deleteStoredSettings(context: Context) {
    val consent = getObserveConsent(context) ?: return preferences.delete(context)
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit(commit = true) {
      clear()
      putString(KEY_OBSERVE_CONSENT, consent)
    }
  }

  /** The consent value saved by `Observe.setConsent`. `null` until the first call. */
  internal fun getObserveConsent(context: Context): String? =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).getString(KEY_OBSERVE_CONSENT, null)

  /**
   * Saves the consent value, and the crash cursor when it is given, in one write. The cursor does
   * not move back. Returns whether the values were written to disk.
   */
  internal fun saveObserveConsent(
    context: Context,
    consent: String,
    lastProcessedExitMillis: Long? = null,
    keepOnFailure: Boolean = false
  ): Boolean {
    val settings = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val previousConsent = settings.getString(KEY_OBSERVE_CONSENT, null)
    val previousCursor = settings.getLong(KEY_LAST_PROCESSED_EXIT_MILLIS, 0L)
    val hasCursor = settings.contains(KEY_LAST_PROCESSED_EXIT_MILLIS)
    val editor = settings.edit().putString(KEY_OBSERVE_CONSENT, consent)
    if (lastProcessedExitMillis != null) {
      editor.putLong(KEY_LAST_PROCESSED_EXIT_MILLIS, maxOf(lastProcessedExitMillis, previousCursor))
    }
    if (editor.commit()) {
      return true
    }
    if (!keepOnFailure) {
      // `commit` keeps the values in memory when the disk write fails, and the next write of this
      // file saves them. So the earlier values go back.
      settings.edit(commit = true) {
        if (previousConsent != null) {
          putString(KEY_OBSERVE_CONSENT, previousConsent)
        } else {
          remove(KEY_OBSERVE_CONSENT)
        }
        if (hasCursor) {
          putLong(KEY_LAST_PROCESSED_EXIT_MILLIS, previousCursor)
        } else {
          remove(KEY_LAST_PROCESSED_EXIT_MILLIS)
        }
      }
    }
    return false
  }
}
