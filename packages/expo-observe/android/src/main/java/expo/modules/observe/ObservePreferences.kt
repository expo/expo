package expo.modules.observe

import android.content.Context
import androidx.core.content.edit
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

private const val PREFS_NAME = "dev.expo.observe"
private const val KEY_CONFIG = "config"

/**
 * Snapshot of the last `configure(...)` payload
 */
@Serializable
data class PersistedConfig(
  val dispatchingEnabled: Boolean? = null,
  val dispatchInDebug: Boolean? = null,
  val sampleRate: Double? = null
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
}
