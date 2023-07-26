package abi49_0_0.expo.modules.navigationbar

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.util.Log
import abi49_0_0.expo.modules.core.interfaces.ReactActivityLifecycleListener

// this needs to stay for versioning to work
import abi49_0_0.host.exp.expoview.R

class NavigationBarReactActivityLifecycleListener(activityContext: Context) : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    // Execute static tasks before the JS engine starts.
    // These values are defined via config plugins.

    var borderColor = getBorderColor(activity)
    if (borderColor != null) {
      NavigationBar.setBorderColor(activity, borderColor)
    }

    var visibility = getVisibility(activity)
    if (visibility != "") {
      NavigationBar.setVisibility(activity, visibility)
    }

    var position = getPosition(activity)
    if (position != "") {
      NavigationBar.setPosition(activity, position)
    }

    var behavior = getBehavior(activity)
    if (behavior != "") {
      NavigationBar.setBehavior(activity, behavior)
    }

    var legacyVisible = getLegacyVisible(activity)
    if (legacyVisible != "") {
      NavigationBar.setLegacyVisible(activity, legacyVisible)
    }
  }

  private fun getBorderColor(context: Context): Int? {
    var value = context.getString(R.string.expo_navigation_bar_border_color)

    var parsed = value.toIntOrNull()
    if (value != null && value != "" && parsed == null) {
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
