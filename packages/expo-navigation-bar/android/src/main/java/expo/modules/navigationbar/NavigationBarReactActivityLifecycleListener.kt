package expo.modules.navigationbar

import android.app.Activity
import android.os.Bundle
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class NavigationBarReactActivityLifecycleListener : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    // Execute static tasks before the JS engine starts.
    // These values are defined via config plugins.
    val visibility = activity.getString(R.string.expo_navigation_bar_visibility).lowercase()

    if (visibility.isNotBlank()) {
      val window = activity.window

      WindowInsetsControllerCompat(window, window.decorView).run {
        when (visibility) {
          "hidden" -> hide(WindowInsetsCompat.Type.navigationBars())
          "visible" -> show(WindowInsetsCompat.Type.navigationBars())
        }
      }
    }
  }
}
