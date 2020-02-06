package expo.modules.splashscreen

import android.app.Activity
import android.os.Handler
import android.view.View
import android.view.ViewGroup
import java.lang.ref.WeakReference

const val SEARCH_FOR_ROOT_VIEW_INTERVAL = 20L

class SplashScreenController(
  activity: Activity,
  resizeMode: SplashScreenImageResizeMode,
  private val rootViewClass: Class<*>,
  splashScreenConfigurator: SplashScreenConfigurator
) {
  private val weakActivity = WeakReference(activity)
  private val contentView: ViewGroup = activity.findViewById(android.R.id.content) ?: throw NoContentViewException()
  private var splashScreenView: View = SplashScreenView(activity, resizeMode, splashScreenConfigurator)
  private val handler = Handler()

  private var state = State.NO_ROOT_VIEW
  private var autoHideEnabled = true
  private var splashScreenShown = false

  private var rootView: ViewGroup? = null

  // region public lifecycle

  fun showSplashScreen(successCallback: () -> Unit) {
    weakActivity.get()!!.runOnUiThread {
      contentView.addView(splashScreenView)
      splashScreenShown = true
      successCallback()
      searchForRootView()
    }
  }

  fun preventAutoHide(successCallback: () -> Unit, failureCallback: (reason: String) -> Unit) {
    if (!autoHideEnabled) {
      return failureCallback("Native SplashScreen autohiding is already prevented.")
    }

    autoHideEnabled = false
    successCallback()
  }

  fun hideSplashScreen(successCallback: () -> Unit, failureCallback: (reason: String) -> Unit) {
    if (!splashScreenShown) {
      return failureCallback("Native SplashScreen is already hidden.")
    }

    if (weakActivity.get()!!.isFinishing || weakActivity.get()!!.isDestroyed) {
      return failureCallback("Activity is not operable.")
    }

    hide(successCallback)
  }

  // endregion

  // region private lifecycle

  private fun reshow() {
    weakActivity.get()!!.runOnUiThread {
      contentView.addView(splashScreenView)
      splashScreenShown = true
    }
  }

  private fun hide(successCallback: () -> Unit) {
    weakActivity.get()!!.runOnUiThread {
      contentView.removeView(splashScreenView)
      autoHideEnabled = true
      splashScreenShown = false
      successCallback()
    }
  }

  // endregion

  /**
   * Searches for RootView that comforts class given via [SplashScreen.show].
   */
  private fun searchForRootView() {
    // RootView is successfully found in first check (nearly impossible for first call)
    findRootView(contentView)?.let { return@searchForRootView handleRootView(it) }
    handler.postDelayed({ searchForRootView() }, SEARCH_FOR_ROOT_VIEW_INTERVAL)
  }

  private fun findRootView(view: View): ViewGroup? {
    if (rootViewClass.isInstance(view)) {
      return view as ViewGroup
    }
    if (view !is SplashScreenView && view is ViewGroup) {
      for (idx in 0 until view.childCount) {
        findRootView(view.getChildAt(idx))?.let { return@findRootView it }
      }
    }
    return null
  }

  private fun handleRootView(view: ViewGroup) {
    rootView = view
    state = State.ROOT_VIEW_NO_CHILDREN
    if (rootView!!.childCount > 0) {
      state = State.ROOT_VIEW_HAS_CHILDREN
      if (autoHideEnabled) {
        hide { }
      }
    }
    view.setOnHierarchyChangeListener(object : ViewGroup.OnHierarchyChangeListener {
      override fun onChildViewRemoved(parent: View, child: View) {
        // TO BE DISCUSSED: mechanism for detecting reloading view hierarchy (reload button)
        // Known cases:
        // - ?
        if (rootView!!.childCount == 0) {
          state = State.ROOT_VIEW_NO_CHILDREN
          reshow()
        }
      }

      override fun onChildViewAdded(parent: View, child: View) {
        // react only to first child
        if (rootView!!.childCount == 1) {
          state = State.ROOT_VIEW_HAS_CHILDREN
          if (autoHideEnabled) {
            hide { }
          }
        }
      }
    })
  }

  /**
   * Indicates state of SplashScreen.
   */
  private enum class State {
    /**
     * InitialState
     * Looking for RootView that comforts RootView class provided via [SplashScreen.show]
     */
    NO_ROOT_VIEW,
    /**
     * SplashScreen is shown.
     */
    ROOT_VIEW_NO_CHILDREN,
    /**
     * SplashScreen is hidden unless autoHiding is disabled.
     * Additionally SplashScreen would listen for the number of children in rootView.
     */
    ROOT_VIEW_HAS_CHILDREN
  }
}

class NoContentViewException : Exception("ContentView is not yet available. Call 'SplashScreen.show(...)' once 'setContentView()' is called.")
