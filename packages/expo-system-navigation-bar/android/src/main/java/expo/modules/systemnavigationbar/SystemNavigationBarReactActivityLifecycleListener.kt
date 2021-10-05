package expo.modules.systemnavigationbar

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.os.Handler
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class SystemNavigationBarReactActivityLifecycleListener(activityContext: Context) : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    // Execute static tasks before the JS engine starts.
    // These values are defined via config plugins.
    Handler(activity.mainLooper).post {
      var backgroundColor = getBackgroundColor(activity)
      if (backgroundColor != null) {
        SystemNavigationBar.setBackgroundColor(activity, backgroundColor)
      }

      var borderColor = getBorderColor(activity)
      if (borderColor != null) {
        SystemNavigationBar.setBorderColor(activity, borderColor)
      }

      var appearance = getAppearance(activity)
      if (appearance != "") {
        SystemNavigationBar.setAppearance(activity, appearance)
      }

      var visibility = getVisibility(activity)
      if (visibility != "") {
        SystemNavigationBar.setVisibility(activity, visibility)
      }

      var position = getPosition(activity)
      if (position != "") {
        SystemNavigationBar.setPosition(activity, position)
      }

      var behavior = getBehavior(activity)
      if (behavior != "") {
        SystemNavigationBar.setBehavior(activity, behavior)
      }

      var legacyVisible = getLegacyVisible(activity)
      if (legacyVisible != "") {
        SystemNavigationBar.setLegacyVisible(activity, legacyVisible)
      }
    }
  }

  private fun getBackgroundColor(context: Context) = context.getString(R.string.expo_system_navigation_bar_background_color).toIntOrNull()

  private fun getBorderColor(context: Context) = context.getString(R.string.expo_system_navigation_bar_border_color).toIntOrNull()

  private fun getAppearance(context: Context): String = context.getString(R.string.expo_system_navigation_bar_appearance).toLowerCase()

  private fun getVisibility(context: Context): String = context.getString(R.string.expo_system_navigation_bar_visibility).toLowerCase()

  private fun getPosition(context: Context): String = context.getString(R.string.expo_system_navigation_bar_position).toLowerCase()

  private fun getBehavior(context: Context): String = context.getString(R.string.expo_system_navigation_bar_behavior).toLowerCase()

  private fun getLegacyVisible(context: Context): String = context.getString(R.string.expo_system_navigation_bar_legacy_visible).toLowerCase()

}
