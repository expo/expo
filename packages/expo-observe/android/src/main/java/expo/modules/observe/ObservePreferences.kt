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
}
