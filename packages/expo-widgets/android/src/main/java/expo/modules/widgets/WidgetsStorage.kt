package expo.modules.widgets

import android.content.Context
import androidx.core.content.edit

internal object WidgetsStorage {
  private const val PREFERENCES_NAME = "expo.modules.widgets"

  fun setWidgetLayout(context: Context, name: String, layout: String) {
    preferences(context).edit(commit = true) {
      putString(layoutKey(name), layout)
    }
  }

  fun getWidgetLayout(context: Context, name: String): String? {
    return preferences(context).getString(layoutKey(name), null)
  }

  private fun preferences(context: Context) =
    context.applicationContext.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)

  private fun layoutKey(name: String) = "widget.$name.layout"

}
