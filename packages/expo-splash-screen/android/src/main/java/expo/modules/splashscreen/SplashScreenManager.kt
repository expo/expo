package expo.modules.splashscreen

import android.app.Activity
import android.os.Build
import android.view.View
import android.view.ViewTreeObserver.OnPreDrawListener
import android.view.animation.AccelerateInterpolator
import android.window.SplashScreenView
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.splashscreen.SplashScreenViewProvider
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.UiThreadUtil

object SplashScreenManager {
  private var keepSplashScreenOnScreen = true
  var preventAutoHideCalled: Boolean = false
  private var exitAnimationDuration = SplashScreenOptions().duration
  private var exitAnimationFade = SplashScreenOptions().fade

  private val contentAppearedListener = ReactMarker.MarkerListener { name, _, _ ->
    if (name == ReactMarkerConstants.CONTENT_APPEARED) {
      if (!preventAutoHideCalled) {
        hide()
      }
    }
  }

  fun registerOnActivity(mainActivity: Activity) {
    val splashScreen = mainActivity.installSplashScreen()
    ReactMarker.addListener(contentAppearedListener)
    SplashScreenPrerender.showIfPrepared(mainActivity)

    // Using `splashScreen.setKeepOnScreenCondition()` does not work on apis below 33
    // so we need to implement this ourselves.
    val contentView = mainActivity.findViewById<View>(android.R.id.content)
    val observer = contentView.viewTreeObserver
    observer.addOnPreDrawListener(object : OnPreDrawListener {
      override fun onPreDraw(): Boolean {
        // The prerendered snapshot replaces the splash screen. It knows whether it matches the
        // window only after the layout that precedes this draw.
        if (keepSplashScreenOnScreen && !SplashScreenPrerender.isShown) {
          return false
        }
        contentView.viewTreeObserver.removeOnPreDrawListener(this)
        return true
      }
    })

    splashScreen.setOnExitAnimationListener { splashScreenViewProvider ->
      val splashScreenView = splashScreenViewProvider.view
      if (SplashScreenPrerender.isShown) {
        // The snapshot is already under the splash screen; it fades out on `hide()` instead.
        removeSplashScreenView(splashScreenViewProvider)
        return@setOnExitAnimationListener
      }
      splashScreenView
        .animate()
        .setDuration(exitAnimationDuration)
        .alpha(0.0f)
        .setInterpolator(AccelerateInterpolator())
        .withEndAction {
          removeSplashScreenView(splashScreenViewProvider)
        }.start()
    }
  }

  private fun removeSplashScreenView(splashScreenViewProvider: SplashScreenViewProvider) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      splashScreenViewProvider.remove()
    } else {
      // Avoid calling applyThemesSystemBarAppearance
      (splashScreenViewProvider.view as SplashScreenView).remove()
    }
  }

  fun hide() {
    keepSplashScreenOnScreen = false
    UiThreadUtil.runOnUiThread {
      val fadeDuration = if (exitAnimationFade) exitAnimationDuration else 0L
      SplashScreenPrerender.dismiss(fadeDuration)
      // The screen that replaces the splash is, by definition, the one to prerender next time.
      // Capture it once it has settled behind the fade.
      SplashScreenPrerender.captureLaunchScreen(fadeDuration + 250L)
    }
  }

  fun setSplashScreenOptions(options: SplashScreenOptions) {
    exitAnimationDuration = options.duration
    exitAnimationFade = options.fade
  }

  fun unregisterContentAppearedListener() {
    ReactMarker.removeListener(contentAppearedListener)
  }
}
