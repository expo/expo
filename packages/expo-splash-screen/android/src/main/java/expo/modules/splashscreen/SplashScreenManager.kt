package expo.modules.splashscreen

import android.app.Activity
import android.app.Application
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.ViewTreeObserver.OnPreDrawListener
import android.view.animation.AccelerateInterpolator
import android.window.SplashScreenView
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import java.lang.ref.WeakReference

object SplashScreenManager {
  private var keepSplashScreenOnScreen = true
  var preventAutoHideCalled: Boolean = false
  var userControlledAutoHide: Boolean = false
  private var exitAnimationDuration = SplashScreenOptions().duration
  private var registeredActivity: WeakReference<Activity>? = null
  private var relaunchedForConfigurationChange = false

  private val registeredActivityDestroyedListener = object : Application.ActivityLifecycleCallbacks {
    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) = Unit

    override fun onActivityStarted(activity: Activity) = Unit

    override fun onActivityResumed(activity: Activity) = Unit

    override fun onActivityPaused(activity: Activity) = Unit

    override fun onActivityStopped(activity: Activity) = Unit

    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit

    override fun onActivityDestroyed(activity: Activity) {
      if (activity === registeredActivity?.get()) {
        relaunchedForConfigurationChange = activity.isChangingConfigurations
      }
    }
  }

  private val contentAppearedListener = ReactMarker.MarkerListener { name, _, _ ->
    if (name == ReactMarkerConstants.CONTENT_APPEARED) {
      if (!preventAutoHideCalled) {
        hide()
      }
    }
  }

  fun registerOnActivity(mainActivity: Activity) {
    if (userControlledAutoHide && !relaunchedForConfigurationChange) {
      keepSplashScreenOnScreen = true
    }
    relaunchedForConfigurationChange = false
    if (registeredActivity == null) {
      mainActivity.application.registerActivityLifecycleCallbacks(registeredActivityDestroyedListener)
    }
    registeredActivity = WeakReference(mainActivity)
    val splashScreen = mainActivity.installSplashScreen()
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

    splashScreen.setOnExitAnimationListener { splashScreenViewProvider ->
      val splashScreenView = splashScreenViewProvider.view
      splashScreenView
        .animate()
        .setDuration(exitAnimationDuration)
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

  fun hide() {
    keepSplashScreenOnScreen = false
  }

  fun setSplashScreenOptions(options: SplashScreenOptions) {
    exitAnimationDuration = options.duration
  }

  fun unregisterContentAppearedListener() {
    ReactMarker.removeListener(contentAppearedListener)
  }
}
