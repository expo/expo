package expo.modules.observe

import android.content.Context
import expo.modules.appmetrics.ConsentGatedPreferences
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

private const val PREFS_NAME = "dev.expo.observe"
private const val KEY_CONFIG = "config"
private const val KEY_BUNDLE_DEFAULTS = "bundleDefaults"
private const val KEY_LAST_DISPATCHED_METRIC_ID = "lastDispatchedMetricId"
private const val KEY_LAST_DISPATCHED_LOG_ID = "lastDispatchedLogId"

/**
 * Snapshot of the last `configure(...)` payload
 */
@Serializable
data class PersistedConfig(
  val dispatchingEnabled: Boolean? = null,
  val dispatchInDebug: Boolean? = null,
  val sampleRate: Double? = null,
  val errorSampleRate: Double? = null,
  val ignoredMetrics: List<String> = emptyList(),
  val ignoredEvents: List<String> = emptyList()
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
  private val preferences = ConsentGatedPreferences(PREFS_NAME)

  fun getConfig(context: Context): PersistedConfig? {
    val json = preferences.getString(context, KEY_CONFIG) ?: return null
    return runCatching { Json.decodeFromString<PersistedConfig>(json) }.getOrNull()
  }

  fun setConfig(context: Context, config: PersistedConfig) {
    preferences.putString(context, KEY_CONFIG, Json.encodeToString(config))
  }

  fun getBundleDefaults(context: Context): PersistedBundleDefaults? {
    val json = preferences.getString(context, KEY_BUNDLE_DEFAULTS) ?: return null
    return runCatching { Json.decodeFromString<PersistedBundleDefaults>(json) }.getOrNull()
  }

  fun setBundleDefaults(context: Context, defaults: PersistedBundleDefaults) {
    preferences.putString(context, KEY_BUNDLE_DEFAULTS, Json.encodeToString(defaults), commit = false)
  }

  fun getLastDispatchedMetricId(context: Context): Long =
    preferences.getLong(context, KEY_LAST_DISPATCHED_METRIC_ID, -1)

  fun setLastDispatchedMetricId(context: Context, id: Long) {
    preferences.putLong(context, KEY_LAST_DISPATCHED_METRIC_ID, id)
  }

  fun getLastDispatchedLogId(context: Context): Long =
    preferences.getLong(context, KEY_LAST_DISPATCHED_LOG_ID, -1)

  fun setLastDispatchedLogId(context: Context, id: Long) {
    preferences.putLong(context, KEY_LAST_DISPATCHED_LOG_ID, id)
  }
}
