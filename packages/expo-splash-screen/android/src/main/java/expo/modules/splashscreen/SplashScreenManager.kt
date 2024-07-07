package expo.modules.splashscreen

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.app.Activity
import android.os.Build
import android.view.View
import android.view.ViewTreeObserver
import android.view.animation.AccelerateInterpolator
import android.window.SplashScreenView
import androidx.annotation.StyleRes
import androidx.core.splashscreen.SplashScreen
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import kotlin.math.min

private enum class Status {
  HIDDEN,
  HIDING,
  INITIALIZING,
  VISIBLE,
}

object SplashScreenManager {
  private var hideSplashScreenOptions: HideSplashScreenOptions = HideSplashScreenOptions()
  private var themeResId: Int = -1
  private var keepSplashScreenOnScreen = true
  private var status = Status.HIDDEN
  private var registered = false

  private fun configureSplashScreen(splashScreen: SplashScreen) {
    val duration = hideSplashScreenOptions.duration
//    splashScreen.setKeepOnScreenCondition {
//      keepSplashScreenOnScreen
//    }

    splashScreen.setOnExitAnimationListener { splashScreenViewProvider ->
      splashScreenViewProvider.view.animate()
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
    if (registered) {
      return
    }
    registered = true
    val splashScreen = activity.installSplashScreen()

    val content: View = activity.findViewById(android.R.id.content)
    content.viewTreeObserver.addOnPreDrawListener(
      object : ViewTreeObserver.OnPreDrawListener {
        override fun onPreDraw(): Boolean {
          return if (!keepSplashScreenOnScreen) {
            content.viewTreeObserver.removeOnPreDrawListener(this)
            true
          } else {
            false
          }
        }
      }
    )

    configureSplashScreen(splashScreen)
  }

  fun hide(options: HideSplashScreenOptions?) {
    if (options != null) {
      hideSplashScreenOptions = options
    }
    keepSplashScreenOnScreen = false
  }

  fun clear() {
    status = Status.HIDDEN
    themeResId = -1
  }
}
