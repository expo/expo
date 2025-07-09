package expo.modules.navigationbar

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.util.Log
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.navigationbar.singletons.NavigationBar

class NavigationBarReactActivityLifecycleListener : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    // Execute static tasks before the JS engine starts.
    // These values are defined via config plugins.

    val borderColor = getBorderColor(activity)
    if (borderColor != null) {
      NavigationBar.setBorderColor(activity, borderColor)
    }

    val visibility = getVisibility(activity)
    if (visibility.isNotBlank()) {
      NavigationBar.setVisibility(activity, visibility)
    }

    val position = getPosition(activity)
    if (position.isNotBlank()) {
      NavigationBar.setPosition(activity, position)
    }

    val behavior = getBehavior(activity)
    if (behavior.isNotBlank()) {
      NavigationBar.setBehavior(activity, behavior)
    }

    val legacyVisible = getLegacyVisible(activity)
    if (legacyVisible.isNotBlank()) {
      NavigationBar.setLegacyVisible(activity, legacyVisible)
    }
  }

  private fun getBorderColor(context: Context): Int? {
    val value = context.getString(R.string.expo_navigation_bar_border_color)

    val parsed = value.toIntOrNull()
    if (value.isNotBlank() && parsed == null) {
      Log.e(ERROR_TAG, "Invalid XML value \"$value\" for string \"expo_navigation_bar_border_color\". Expected a valid color int like \"-12177173\". Ensure the value of \"borderColor\" in the \"expo-navigation-bar\" config plugin is a valid CSS color. Skipping initial border color.")
    }
    return parsed
  }

  private fun getVisibility(context: Context): String = context.getString(R.string.expo_navigation_bar_visibility).lowercase()

  private fun getPosition(context: Context): String = context.getString(R.string.expo_navigation_bar_position).lowercase()

  private fun getBehavior(context: Context): String = context.getString(R.string.expo_navigation_bar_behavior).lowercase()

  private fun getLegacyVisible(context: Context): String = context.getString(R.string.expo_navigation_bar_legacy_visible).lowercase()

  companion object {
    private const val ERROR_TAG = "ERR_NAVIGATION_BAR"
  }
}
