package expo.modules.splashscreen

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.app.Activity
import android.os.Build
import android.view.View
import android.view.ViewTreeObserver.OnPreDrawListener
import android.view.animation.AccelerateInterpolator
import android.window.SplashScreenView
import androidx.core.splashscreen.SplashScreen
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import kotlin.math.min

object SplashScreenManager {
  private var keepSplashScreenOnScreen = true
  private lateinit var splashScreen: SplashScreen

  private fun configureSplashScreen(options: SplashScreenOptions = SplashScreenOptions()) {
    val duration = options.duration

    splashScreen.setOnExitAnimationListener { splashScreenViewProvider ->
      splashScreenViewProvider.view
        .animate()
        .setDuration(duration)
        .setStartDelay(min(0, duration))
        .alpha(0.0f)
        .setInterpolator(AccelerateInterpolator())
        .setListener(object : AnimatorListenerAdapter() {
          override fun onAnimationEnd(animation: Animator) {
            super.onAnimationEnd(animation)
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
              splashScreenViewProvider.remove()
            } else {
              val splashScreenView = splashScreenViewProvider.view as SplashScreenView
              splashScreenView.remove()
            }
          }
        }).start()
    }
  }

  fun registerOnActivity(activity: Activity) {
    splashScreen = activity.installSplashScreen()

    // Using `splashScreen.setKeepOnScreenCondition()` does not work on apis below 33
    // so we need to implement this ourselves.
    val contentView = activity.findViewById<View>(android.R.id.content)
    val observer = contentView.viewTreeObserver
    observer.addOnPreDrawListener(object : OnPreDrawListener {
      override fun onPreDraw(): Boolean {
        if (keepSplashScreenOnScreen) {
          return false
        }
        contentView.viewTreeObserver.removeOnPreDrawListener(this)
        return true
      }
    })
    configureSplashScreen()
  }

  fun hide() {
    keepSplashScreenOnScreen = false
  }

  fun setSplashScreenOptions(options: SplashScreenOptions) {
    configureSplashScreen(options)
  }
}
