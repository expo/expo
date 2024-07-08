package expo.modules.splashscreen

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.app.Activity
import android.os.Build
import android.view.animation.AccelerateInterpolator
import android.window.SplashScreenView
import androidx.core.splashscreen.SplashScreen
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import kotlin.math.min

object SplashScreenManager {
  private var splashScreenOptions: SplashScreenOptions = SplashScreenOptions()
  private var keepSplashScreenOnScreen = true
  private lateinit var splashScreen: SplashScreen

  private fun configureSplashScreen(splashScreen: SplashScreen) {
    val duration = splashScreenOptions.duration

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

    splashScreen.setKeepOnScreenCondition {
      keepSplashScreenOnScreen
    }

    configureSplashScreen(splashScreen)
  }

  fun onContentChanged() {
    if (!keepSplashScreenOnScreen) {
      hide()
    }
  }

  fun hide() {
    keepSplashScreenOnScreen = false
  }

  fun setSplashScreenOptions(options: SplashScreenOptions) {
    splashScreenOptions = options
    configureSplashScreen(splashScreen)
  }
}
