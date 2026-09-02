package expo.modules.widgets

import android.content.Context
import androidx.core.content.edit

internal object WidgetsStorage {
  private const val PREFERENCES_NAME = "expo.modules.widgets"

  fun set(context: Context, key: String, value: String) {
    preferences(context).edit(commit = true) { putString(key, value) }
  }

  fun set(context: Context, key: String, value: Map<String, Any?>) {
    set(context, key, WidgetsJson.stringifyMap(value))
  }

  fun set(context: Context, key: String, value: List<Map<String, Any?>>) {
    set(context, key, WidgetsJson.stringifyList(value))
  }

  fun getString(context: Context, key: String): String? {
    return preferences(context).getString(key, null)
  }

  fun getDictionary(context: Context, key: String): Map<String, Any?>? {
    val value = getString(context, key) ?: return null
    return runCatching { WidgetsJson.parseMap(value) }.getOrNull()
  }

  fun remove(context: Context, key: String) {
    preferences(context).edit(commit = true) { remove(key) }
  }

  private fun preferences(context: Context) =
    context.applicationContext.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
}
