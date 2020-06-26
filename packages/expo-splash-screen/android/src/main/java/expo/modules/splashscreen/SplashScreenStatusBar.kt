package expo.modules.splashscreen

import android.annotation.SuppressLint
import android.app.Activity
import android.content.res.Configuration
import android.os.Build
import android.view.View
import android.view.WindowManager
import androidx.annotation.ColorInt
import androidx.annotation.UiThread
import androidx.core.view.ViewCompat

object SplashScreenStatusBar {
  fun configureTranslucent(activity: Activity, translucent: Boolean?) {
    @SuppressLint("ObsoleteSdkInt")
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
      return
    }

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
              defaultInsets.systemWindowInsetBottom)
          }
        } else {
          decorView.setOnApplyWindowInsetsListener(null)
        }
        ViewCompat.requestApplyInsets(decorView)
      }
    }
  }
}
