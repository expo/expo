package expo.modules.observe

import android.content.Context
import androidx.core.content.edit

private const val PREFS_NAME = "dev.expo.observe"
private const val KEY_DISPATCHING_ENABLED = "dispatchingEnabled"

object ObservePreferences {
  fun getDispatchingEnabled(context: Context): Boolean {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    return prefs.getBoolean(KEY_DISPATCHING_ENABLED, true)
  }

  fun setDispatchingEnabled(
    context: Context,
    enabled: Boolean
  ) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    prefs.edit(commit = true) { putBoolean(KEY_DISPATCHING_ENABLED, enabled) }
  }
}
