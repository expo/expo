package expo.modules.splashscreen

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.app.Activity
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.view.animation.AccelerateInterpolator
import android.window.SplashScreenView
import androidx.annotation.StyleRes
import androidx.core.splashscreen.SplashScreen
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import java.util.Timer
import java.util.TimerTask
import kotlin.math.min

private enum class Status {
  HIDDEN,
  HIDING,
  INITIALIZING,
  VISIBLE,
}

object SplashScreenManager {
  var reportWarningToLogBox: ((String) -> Unit?)? = null
  private var hideSplashScreenOptions: HideSplashScreenOptions = HideSplashScreenOptions()
  private var themeResId: Int = -1

  private var initialDialog: SplashScreenDialog? = null
  private var fadeOutDialog: SplashScreenDialog? = null

  private var status = Status.HIDDEN

  private fun configureSplashScreen(splashScreen: SplashScreen) {
    val duration = (hideSplashScreenOptions.duration).toLong()

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

  fun registerOnActivity(activity: Activity, @StyleRes themeResId: Int) {
    val splashScreen = activity.installSplashScreen()
    this.themeResId = themeResId

    val typedValue = TypedValue()
    val currentTheme = activity.theme

    if (currentTheme.resolveAttribute(R.attr.postSplashScreenTheme, typedValue, true)) {
      val finalTheme = typedValue.resourceId
      if (finalTheme != 0) {
        activity.setTheme(finalTheme)
      }
    }

    configureSplashScreen(splashScreen)

    val contentView = activity.findViewById<View>(android.R.id.content)
    contentView.viewTreeObserver.addOnPreDrawListener(object : ViewTreeObserver.OnPreDrawListener {
      override fun onPreDraw(): Boolean {
        return if (status != Status.INITIALIZING) {
          contentView.viewTreeObserver.removeOnPreDrawListener(this)
          true
        } else {
          false
        }
      }
    })

    initialDialog = SplashScreenDialog(activity, themeResId, false)
    initialDialog?.show {
      status = Status.VISIBLE
    }
  }

  fun hide(options: HideSplashScreenOptions?, currentActivity: Activity?) {
    if (options != null) {
      hideSplashScreenOptions = options
    }
    if (status == Status.INITIALIZING || currentActivity == null || currentActivity.isFinishing || currentActivity.isDestroyed) {
      val timer = Timer()
      timer.schedule(object : TimerTask() {
        override fun run() {
          timer.cancel()
          hide(options, currentActivity)
        }

      }, 100)
      return
    }

    if (status == Status.HIDING) {
      return
    }

    if (initialDialog == null || status == Status.HIDDEN) {
      return
    }

    status = Status.HIDING

    options?.fade?.let {
      fadeOutDialog = SplashScreenDialog(currentActivity, themeResId, true)
      fadeOutDialog?.show {
        initialDialog?.dismiss {
          fadeOutDialog?.dismiss {
            status = Status.HIDDEN
            initialDialog = null
            fadeOutDialog = null
          }
        }
      }
      return
    }

    initialDialog?.dismiss {
      status = Status.HIDDEN
      initialDialog = null
    }
  }

  fun clear() {
    status = Status.HIDDEN
    themeResId = -1

    if (initialDialog != null) {
      initialDialog?.dismiss()
      initialDialog = null
    }
    if (fadeOutDialog != null) {
      fadeOutDialog?.dismiss()
      fadeOutDialog = null
    }
  }
}
