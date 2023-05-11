package expo.modules.splashscreen

import android.animation.Animator
import android.app.Activity
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import expo.modules.splashscreen.exceptions.NoContentViewException
import java.lang.ref.WeakReference

const val SEARCH_FOR_ROOT_VIEW_INTERVAL = 20L

open class SplashScreenViewController(
  activity: Activity,
  private val rootViewClass: Class<out ViewGroup>,
  private val splashScreenView: View
) {
  private val weakActivity = WeakReference(activity)
  private val contentView: ViewGroup = activity.findViewById(android.R.id.content)
    ?: throw NoContentViewException()
  private val handler = Handler(Looper.getMainLooper())

  private var autoHideEnabled = true
  private var splashScreenShown = false

  private var rootView: ViewGroup? = null

  // region public lifecycle

  open fun showSplashScreen(successCallback: () -> Unit = {}) {
    weakActivity.get()?.runOnUiThread {
      (splashScreenView.parent as? ViewGroup)?.removeView(splashScreenView)
      contentView.addView(splashScreenView)
      splashScreenShown = true
      successCallback()
      searchForRootView()
    }
  }

  fun preventAutoHide(
    successCallback: (hasEffect: Boolean) -> Unit,
    failureCallback: (reason: String) -> Unit
  ) {
    if (!autoHideEnabled || !splashScreenShown) {
      return successCallback(false)
    }

    autoHideEnabled = false
    successCallback(true)
  }

  open fun hideSplashScreen(
    successCallback: (hasEffect: Boolean) -> Unit = {},
    failureCallback: (reason: String) -> Unit = {}
  ) {
    if (!splashScreenShown) {
      return successCallback(false)
    }

    // activity SHOULD be present at this point - if it's not, it means that application is already dead
    val activity = weakActivity.get()
    if (activity == null || activity.isFinishing || activity.isDestroyed) {
      return failureCallback("Cannot hide native splash screen on activity that is already destroyed (application is already closed).")
    }

    var fadeTime = 0L
    try {
      fadeTime = activity?.getString(R.string.expo_splash_screen_fade_time)?.toLong() ?: 0L
      if (fadeTime > MAXIMUM_FADE_TIME || fadeTime < MINIMUM_FADE_TIME) {
        fadeTime = 0L
      }
    } catch (e: java.lang.NumberFormatException) {
      // If fadeTime string is not a number, use the default
    }

    Handler(activity.mainLooper).post {
      if (fadeTime > 0L) {
        val anim = splashScreenView.animate()
        anim.alpha(0f)
        anim.duration = fadeTime
        anim.setListener(object : Animator.AnimatorListener {
          override fun onAnimationStart(animation: Animator) {}
          override fun onAnimationCancel(animation: Animator) {}
          override fun onAnimationRepeat(animation: Animator) {}
          override fun onAnimationEnd(animation: Animator) {
            contentView.removeView(splashScreenView)
            autoHideEnabled = true
            splashScreenShown = false
            successCallback(true)
          }
        })
        anim.start()
      } else {
        contentView.removeView(splashScreenView)
        autoHideEnabled = true
        splashScreenShown = false
        successCallback(true)
      }
    }
  }

  // endregion

  /**
   * Searches for RootView that conforms to class given via [SplashScreen.show].
   * If [rootView] is already found this method is noop.
   */
  private fun searchForRootView() {
    if (rootView != null) {
      return
    }
    // RootView is successfully found in first check (nearly impossible for first call)
    findRootView(contentView)?.let { return@searchForRootView handleRootView(it) }
    handler.postDelayed({ searchForRootView() }, SEARCH_FOR_ROOT_VIEW_INTERVAL)
  }

  private fun findRootView(view: View): ViewGroup? {
    if (rootViewClass.isInstance(view)) {
      return view as ViewGroup
    }
    if (view != splashScreenView && view is ViewGroup) {
      for (idx in 0 until view.childCount) {
        findRootView(view.getChildAt(idx))?.let { return@findRootView it }
      }
    }
    return null
  }

  private fun handleRootView(view: ViewGroup) {
    rootView = view
    if ((rootView?.childCount ?: 0) > 0) {
      if (autoHideEnabled) {
        hideSplashScreen()
      }
    }
    view.setOnHierarchyChangeListener(object : ViewGroup.OnHierarchyChangeListener {
      override fun onChildViewRemoved(parent: View, child: View) {
        // TODO: ensure mechanism for detecting reloading view hierarchy works (reload button)
        if (rootView?.childCount == 0) {
          showSplashScreen()
        }
      }

      override fun onChildViewAdded(parent: View, child: View) {
        // react only to first child
        if (rootView?.childCount == 1) {
          if (autoHideEnabled) {
            hideSplashScreen()
          }
        }
      }
    })
  }

  companion object {
    val MINIMUM_FADE_TIME = 0L
    val MAXIMUM_FADE_TIME = 5000L
  }
}
