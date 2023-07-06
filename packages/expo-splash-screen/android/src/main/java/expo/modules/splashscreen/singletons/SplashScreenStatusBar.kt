package expo.modules.splashscreen.singletons

import android.app.Activity
import androidx.core.view.ViewCompat

object SplashScreenStatusBar {
  fun configureTranslucent(activity: Activity, translucent: Boolean?) {
    translucent?.let {
      activity.runOnUiThread {
        // If the status bar is translucent hook into the window insets calculations
        // and consume all the top insets so no padding will be added under the status bar.
        val decorView = activity.window.decorView
        if (it) {
          decorView.setOnApplyWindowInsetsListener { v, insets ->
            val defaultInsets = v.onApplyWindowInsets(insets)
            defaultInsets.replaceSystemWindowInsets(
              defaultInsets.systemWindowInsetLeft,
              0,
              defaultInsets.systemWindowInsetRight,
              defaultInsets.systemWindowInsetBottom
            )
          }
        } else {
          decorView.setOnApplyWindowInsetsListener(null)
        }
        ViewCompat.requestApplyInsets(decorView)
      }
    }
  }
}
