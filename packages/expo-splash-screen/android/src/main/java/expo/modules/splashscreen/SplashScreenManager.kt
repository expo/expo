package expo.modules.splashscreen

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.view.animation.AccelerateInterpolator
import androidx.core.splashscreen.SplashScreen
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen

object SplashScreenManager {
  var reportWarningToLogBox: ((String) -> Unit?)? = null
  private var splashShownOnScreen = true
  private var splashIndicatorShownOnScreen = true
  private var hideSplashScreenOptions: HideSplashScreenOptions = HideSplashScreenOptions()
  private var moduleOptions: ModuleOptions = ModuleOptions()
  private val isProduction = false

  private fun replaceSplashscreenWithIndicator(contentView: ViewGroup) {
    val rootView = View.inflate(contentView.context, R.layout.splash_screen_indicator, contentView)
    rootView.findViewById<ViewGroup>(R.id.indicator)
    splashShownOnScreen = false
    splashIndicatorShownOnScreen = true
  }

  private fun waitForAppLoad(activity: Activity) {
    val contentView = activity.findViewById<ViewGroup>(android.R.id.content)
    val rootView = contentView.rootView as ViewGroup

    rootView.setOnHierarchyChangeListener(object : ViewGroup.OnHierarchyChangeListener {
      override fun onChildViewAdded(parent: View, child: View) {
        replaceSplashscreenWithIndicator(contentView)
        rootView.setOnHierarchyChangeListener(null)
      }
      override fun onChildViewRemoved(parent: View, child: View) {
      }
    })
  }

  private fun configureSplashScreen(splashScreen: SplashScreen) {
    val duration = (hideSplashScreenOptions.duration).toLong()

    splashScreen.setOnExitAnimationListener { splashScreenViewProvider ->
      splashScreenViewProvider.view.animate()
        .setDuration(duration)
        .alpha(0.0f)
        .setInterpolator(AccelerateInterpolator())
        .setListener(object : AnimatorListenerAdapter() {
          override fun onAnimationEnd(animation: Animator) {
            super.onAnimationEnd(animation)
            splashScreenViewProvider.remove()
          }
        }).start()
    }
  }

  fun registerOnActivity(activity: Activity) {
    val splashScreen = activity.installSplashScreen()
    configureSplashScreen(splashScreen)
    splashScreen.setKeepOnScreenCondition { splashShownOnScreen }
    if (!isProduction) {
      waitForAppLoad(activity)
    }
  }

  private fun hideIndicator(activity: Activity) {
    // Ensure splash screen is hidden
    splashShownOnScreen = false

    if (!splashIndicatorShownOnScreen) {
      return
    }
    splashIndicatorShownOnScreen = false
    val indicatorView = activity.findViewById<ViewGroup>(R.id.indicator) ?: return
    val duration = (hideSplashScreenOptions.duration).toLong()

    indicatorView.animate()
      .setDuration(duration)
      .alpha(0.0f)
      .setInterpolator(AccelerateInterpolator())
      .setListener(object : AnimatorListenerAdapter() {
        override fun onAnimationEnd(animation: Animator) {
          super.onAnimationEnd(animation)
          activity.runOnUiThread {
            (indicatorView.parent as ViewGroup?)?.removeView(indicatorView)
          }
        }
      }).start()
  }

  fun hide(options: HideSplashScreenOptions?, currentActivity: Activity?) {
    if (options != null) {
      hideSplashScreenOptions = options
    }
    splashShownOnScreen = false
    if (currentActivity != null) {
      hideIndicator(currentActivity)
    }
  }

  fun onContentChanged(activity: Activity?) {
    if (activity == null) {
      return
    }
    if (moduleOptions.delay != null) {
      Handler(Looper.getMainLooper()).postDelayed({
        if (splashIndicatorShownOnScreen) {
          reportWarningToLogBox?.let { it("Splash screen was hidden by a timeout. This is not recommended, and you should call .hide() as soon as your initial screen is ready.") }
        }
        hide(null, activity)
      }, moduleOptions.delay!!.toLong())
    }
  }
}
