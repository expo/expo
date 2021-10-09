package expo.modules.navigationbar

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.os.Handler
import android.util.Log
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class NavigationBarReactActivityLifecycleListener(activityContext: Context) : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    // Execute static tasks before the JS engine starts.
    // These values are defined via config plugins.

     var appearance = getAppearance(activity)
     if (appearance != "") {
       NavigationBar.setAppearance(activity, appearance)
     }

     var backgroundColor = getBackgroundColor(activity)
     if (backgroundColor != null) {
       NavigationBar.setBackgroundColor(activity, backgroundColor)
     }

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

  private fun getBackgroundColor(context: Context): Int? {
      var value = context.getString(R.string.expo_navigation_bar_background_color);

    var parsed = value.toIntOrNull();
     if (value != null && parsed == null) {
         // TODO: Maybe throw in development mode?
         Log.e(ERROR_TAG, "Invalid XML value \"$value\" for string \"expo_navigation_bar_background_color\". Expected a valid color int like \"-12177173\". Ensure the value of \"backgroundColor\" in the \"expo-navigation-bar\" config plugin is a valid CSS color. Skipping initial background color.")
     }
     return parsed
 }

    private fun getBorderColor(context: Context): Int? {
        var value = context.getString(R.string.expo_navigation_bar_border_color);

        var parsed = value.toIntOrNull();
        if (value != null && parsed == null) {
            Log.e(ERROR_TAG, "Invalid XML value \"$value\" for string \"expo_navigation_bar_border_color\". Expected a valid color int like \"-12177173\". Ensure the value of \"borderColor\" in the \"expo-navigation-bar\" config plugin is a valid CSS color. Skipping initial border color.")
        }
        return parsed
    }

 private fun getAppearance(context: Context): String = context.getString(R.string.expo_navigation_bar_appearance).toLowerCase()

  private fun getVisibility(context: Context): String = context.getString(R.string.expo_navigation_bar_visibility).toLowerCase()

  private fun getPosition(context: Context): String = context.getString(R.string.expo_navigation_bar_position).toLowerCase()

  private fun getBehavior(context: Context): String = context.getString(R.string.expo_navigation_bar_behavior).toLowerCase()

  private fun getLegacyVisible(context: Context): String = context.getString(R.string.expo_navigation_bar_legacy_visible).toLowerCase()

    companion object {
        private const val ERROR_TAG = "ERR_NAVIGATION_BAR"
    }
}
