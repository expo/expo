package expo.modules.navigationbar

import android.app.Activity
import android.content.Context
import android.os.Bundle
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.navigationbar.singletons.NavigationBar

class NavigationBarReactActivityLifecycleListener : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    // Execute static tasks before the JS engine starts.
    // These values are defined via config plugins.

    val visibility = getVisibility(activity)
    if (visibility.isNotBlank()) {
      NavigationBar.setVisibility(activity, visibility)
    }
  }

  private fun getVisibility(context: Context): String = context.getString(R.string.expo_navigation_bar_visibility).lowercase()
}
