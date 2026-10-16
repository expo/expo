package expo.modules.splashscreen

import android.app.Activity
import android.app.Application.ActivityLifecycleCallbacks
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.ViewTreeObserver.OnPreDrawListener
import android.view.animation.AccelerateInterpolator
import android.window.SplashScreenView
import androidx.core.splashscreen.SplashScreen
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants

object SplashScreenManager {
  private var keepSplashScreenOnScreen = true
  var preventAutoHideCalled: Boolean = false
  private var splashScreen: SplashScreen? = null

  private val contentAppearedListener = ReactMarker.MarkerListener { name, _, _ ->
    if (name == ReactMarkerConstants.CONTENT_APPEARED) {
      if (!preventAutoHideCalled) {
        hide()
      }
    }
  }

  private fun configureSplashScreen(options: SplashScreenOptions = SplashScreenOptions()) {
    val splashScreen = splashScreen ?: return

    val duration = options.duration

    splashScreen.setOnExitAnimationListener { splashScreenViewProvider ->
      val splashScreenView = splashScreenViewProvider.view
      splashScreenView
        .animate()
        .setDuration(duration)
        .alpha(0.0f)
        .setInterpolator(AccelerateInterpolator())
        .withEndAction {
          if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            splashScreenViewProvider.remove()
          } else {
            // Avoid calling applyThemesSystemBarAppearance
            (splashScreenView as SplashScreenView).remove()
          }
        }.start()
    }
  }

  fun registerOnActivity(mainActivity: Activity) {
    val activitySplashScreen = mainActivity.installSplashScreen()
    splashScreen = activitySplashScreen
    ReactMarker.addListener(contentAppearedListener)

    // Using `splashScreen.setKeepOnScreenCondition()` does not work on apis below 33
    // so we need to implement this ourselves.
    val contentView = mainActivity.findViewById<View>(android.R.id.content)
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

    val application = mainActivity.application
    application.registerActivityLifecycleCallbacks(object : ActivityLifecycleCallbacks {
      override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) {}
      override fun onActivityStarted(activity: Activity) {}
      override fun onActivityResumed(activity: Activity) {}
      override fun onActivityPaused(activity: Activity) {}
      override fun onActivityStopped(activity: Activity) {}
      override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) {}
      override fun onActivityDestroyed(activity: Activity) {
        if (activity !== mainActivity) {
          return
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
          activity.splashScreen.clearOnExitAnimationListener()
        }
        if (splashScreen === activitySplashScreen) {
          splashScreen = null
        }
        application.unregisterActivityLifecycleCallbacks(this)
      }
    })
  }

  fun hide() {
    keepSplashScreenOnScreen = false
  }

  fun setSplashScreenOptions(options: SplashScreenOptions) {
    configureSplashScreen(options)
  }

  fun unregisterContentAppearedListener() {
    ReactMarker.removeListener(contentAppearedListener)
  }
}
