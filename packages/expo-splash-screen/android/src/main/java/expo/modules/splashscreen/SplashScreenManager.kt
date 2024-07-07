package expo.modules.splashscreen

import android.app.Activity
import android.os.Build
import android.util.TypedValue
import android.view.View
import android.view.ViewTreeObserver
import androidx.annotation.RequiresApi
import androidx.annotation.StyleRes
import java.util.Timer
import java.util.TimerTask

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

  @RequiresApi(Build.VERSION_CODES.S)
  private fun configureSplashScreen(activity: Activity) {
    activity.splashScreen.setOnExitAnimationListener {
      it.remove()
      activity.splashScreen.clearOnExitAnimationListener()
    }
  }

  fun registerOnActivity(activity: Activity, @StyleRes themeResId: Int) {
    this.themeResId = themeResId

    val typedValue = TypedValue()
    val currentTheme = activity.theme

    if (currentTheme.resolveAttribute(R.attr.postSplashScreenTheme, typedValue, true)) {
      val finalTheme = typedValue.resourceId
      if (finalTheme != 0) {
        activity.setTheme(finalTheme)
      }
    }

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

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      configureSplashScreen(activity)
    }

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
