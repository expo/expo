package expo.modules.splashscreen

import android.app.Activity
import android.view.View
import android.view.ViewTreeObserver.OnPreDrawListener
import android.view.animation.AccelerateInterpolator
import androidx.core.splashscreen.SplashScreen
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants

object SplashScreenManager {
  private var keepSplashScreenOnScreen = true
  var preventAutoHideCalled: Boolean = false
  private lateinit var splashScreen: SplashScreen

  private val contentAppearedListener = ReactMarker.MarkerListener { name, _, _ ->
    if (name == ReactMarkerConstants.CONTENT_APPEARED) {
      if (!preventAutoHideCalled) {
        hide()
      }
    }
  }

  private fun configureSplashScreen(options: SplashScreenOptions = SplashScreenOptions()) {
    val duration = options.duration

    splashScreen.setOnExitAnimationListener { splashScreenViewProvider ->
      splashScreenViewProvider.view
        .animate()
        .setDuration(duration)
        .alpha(0.0f)
        .setInterpolator(AccelerateInterpolator())
        .withEndAction {
          splashScreenViewProvider.remove()
        }.start()
    }
  }

  fun registerOnActivity(activity: Activity) {
    splashScreen = activity.installSplashScreen()
    ReactMarker.addListener(contentAppearedListener)

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

  fun unregisterContentAppearedListener() {
    ReactMarker.removeListener(contentAppearedListener)
  }
}
