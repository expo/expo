package expo.modules.statusbar

import android.app.Activity
import android.content.res.Resources
import android.os.Bundle
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class StatusBarReactActivityLifecycleListener : ReactActivityLifecycleListener {
  private fun isStatusBarHidden(theme: Resources.Theme): Boolean {
    // This value is defined via config plugins
    val attrs = intArrayOf(R.attr.expoStatusBarHidden)
    val typedArray = theme.obtainStyledAttributes(attrs)

    return try {
      typedArray.getBoolean(0, false)
    } finally {
      typedArray.recycle()
    }
  }

  override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
    // Execute static tasks before the JS engine starts
    if (isStatusBarHidden(activity.theme)) {
      val window = activity.window

      WindowInsetsControllerCompat(window, window.decorView)
        .hide(WindowInsetsCompat.Type.statusBars())
    }
  }
}
