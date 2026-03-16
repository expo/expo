package expo.modules.statusbar

import android.app.Activity
import android.os.Bundle
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class StatusBarReactActivityLifecycleListener : ReactActivityLifecycleListener {
  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    val visibility = activity.getString(R.string.expo_status_bar_visibility).lowercase()

    if (visibility.isNotBlank()) {
      val window = activity.window

      WindowInsetsControllerCompat(window, window.decorView).run {
        when (visibility) {
          "hidden" -> hide(WindowInsetsCompat.Type.statusBars())
          "visible" -> show(WindowInsetsCompat.Type.statusBars())
        }
      }
    }
  }
}
