package expo.modules.observe

import android.content.Context
import androidx.core.content.edit
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

private const val PREFS_NAME = "dev.expo.observe"
private const val KEY_CONFIG = "config"
private const val KEY_BUNDLE_DEFAULTS = "bundleDefaults"
private const val KEY_LAST_DISPATCHED_METRIC_ID = "lastDispatchedMetricId"
private const val KEY_LAST_DISPATCHED_LOG_ID = "lastDispatchedLogId"
private const val KEY_ENVIRONMENT = "environment"

// Earlier versions stored the environment in the expo-app-metrics preferences.
private const val LEGACY_PREFS_NAME = "dev.expo.app-metrics"

/**
 * Snapshot of the last `configure(...)` payload
 */
@Serializable
data class PersistedConfig(
  val dispatchingEnabled: Boolean? = null,
  val dispatchInDebug: Boolean? = null,
  val sampleRate: Double? = null
)

/**
 * Bundle-derived facts pushed from the JS layer at package import time.
 */
@Serializable
data class PersistedBundleDefaults(
  val environment: String,
  val isJsDev: Boolean
)

object ObservePreferences {
  fun getConfig(context: Context): PersistedConfig? {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val json = prefs.getString(KEY_CONFIG, null) ?: return null
    return runCatching { Json.decodeFromString<PersistedConfig>(json) }.getOrNull()
  }

  fun setConfig(context: Context, config: PersistedConfig) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    prefs.edit(commit = true) {
      putString(KEY_CONFIG, Json.encodeToString(config))
    }
  }

  fun getBundleDefaults(context: Context): PersistedBundleDefaults? {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val json = prefs.getString(KEY_BUNDLE_DEFAULTS, null) ?: return null
    return runCatching { Json.decodeFromString<PersistedBundleDefaults>(json) }.getOrNull()
  }

  fun setBundleDefaults(context: Context, defaults: PersistedBundleDefaults) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    prefs.edit {
      putString(KEY_BUNDLE_DEFAULTS, Json.encodeToString(defaults))
    }
  }

  fun getLastDispatchedMetricId(context: Context): Long =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getLong(KEY_LAST_DISPATCHED_METRIC_ID, -1)

  fun setLastDispatchedMetricId(context: Context, id: Long) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit(commit = true) {
      putLong(KEY_LAST_DISPATCHED_METRIC_ID, id)
    }
  }

  fun getLastDispatchedLogId(context: Context): Long =
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getLong(KEY_LAST_DISPATCHED_LOG_ID, -1)

  fun setLastDispatchedLogId(context: Context, id: Long) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit(commit = true) {
      putLong(KEY_LAST_DISPATCHED_LOG_ID, id)
    }
  }

  /**
   * The last environment set from JS, or the build default. On the first read after an upgrade,
   * moves the value saved by earlier versions, so sessions started before JS runs keep it.
   */
  @Synchronized
  fun getEnvironment(context: Context): String? {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    prefs.getString(KEY_ENVIRONMENT, null)?.let { return it }
    val legacyPrefs = context.getSharedPreferences(LEGACY_PREFS_NAME, Context.MODE_PRIVATE)
    val legacy = legacyPrefs.getString(KEY_ENVIRONMENT, null) ?: return getDefaultEnvironment()
    setEnvironment(context, legacy)
    legacyPrefs.edit(commit = true) { remove(KEY_ENVIRONMENT) }
    return legacy
  }

  @Synchronized
  fun setEnvironment(context: Context, environment: String) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit(commit = true) {
      putString(KEY_ENVIRONMENT, environment)
    }
  }

  private fun getDefaultEnvironment(): String? {
    return if (BuildConfig.DEBUG) {
      "development"
    } else {
      null
    }
  }
}
