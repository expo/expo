package host.exp.exponent.experience.splashscreen.legacy.singletons

import android.app.Activity
import androidx.core.view.ViewCompat

object SplashScreenStatusBar {
  fun setTranslucent(activity: Activity) {
    activity.runOnUiThread {
      // As the status bar is translucent, hook into the window insets calculations
      // and consume all the top insets so no padding will be added under the status bar.
      val decorView = activity.window.decorView
      decorView.setOnApplyWindowInsetsListener { v, insets ->
        val defaultInsets = v.onApplyWindowInsets(insets)
        defaultInsets.replaceSystemWindowInsets(
          defaultInsets.systemWindowInsetLeft,
          0,
          defaultInsets.systemWindowInsetRight,
          defaultInsets.systemWindowInsetBottom
        )
      }
      ViewCompat.requestApplyInsets(decorView)
    }
  }
}
