package expo.modules.splashscreen

import android.app.Activity
import android.os.Handler
import android.view.View
import android.view.ViewGroup
import expo.modules.splashscreen.exceptions.NoContentViewException
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

  private var rootViewState = RootViewState.NO_ROOT_VIEW
  private var autoHideEnabled = true
  private var splashScreenShown = false

  private var rootView: ViewGroup? = null

  // region public lifecycle

  fun showSplashScreen(successCallback: () -> Unit = Noop) {
    weakActivity.get()?.runOnUiThread {
      contentView.addView(splashScreenView)
      splashScreenShown = true
      successCallback()
      searchForRootView()
    }
  }

  fun preventAutoHide(successCallback: () -> Unit, failureCallback: (reason: String) -> Unit) {
    if (!autoHideEnabled) {
      return failureCallback("Native splash screen autohiding is already prevented.")
    }

    autoHideEnabled = false
    successCallback()
  }

  fun hideSplashScreen(
      successCallback: () -> Unit = Noop,
      failureCallback: (reason: String) -> Unit = Noop
  ) {
    if (!splashScreenShown) {
      return failureCallback("Native splash screen is already hidden.")
    }

    val activity = weakActivity.get()
    if (activity?.isFinishing == true || activity?.isDestroyed == true) {
      return failureCallback("Activity is not operable.")
    }

    weakActivity.get()?.runOnUiThread {
      contentView.removeView(splashScreenView)
      autoHideEnabled = true
      splashScreenShown = false
      successCallback()
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
    if (view !is SplashScreenView && view is ViewGroup) {
      for (idx in 0 until view.childCount) {
        findRootView(view.getChildAt(idx))?.let { return@findRootView it }
      }
    }
    return null
  }

  private fun handleRootView(view: ViewGroup) {
    rootView = view
    rootViewState = RootViewState.ROOT_VIEW_NO_CHILDREN
    if ((rootView?.childCount ?: 0) > 0) {
      rootViewState = RootViewState.ROOT_VIEW_HAS_CHILDREN
      if (autoHideEnabled) {
        hideSplashScreen()
      }
    }
    view.setOnHierarchyChangeListener(object : ViewGroup.OnHierarchyChangeListener {
      override fun onChildViewRemoved(parent: View, child: View) {
        // TODO: ensure mechanism for detecting reloading view hierarchy works (reload button)
        if (rootView?.childCount == 0) {
          rootViewState = RootViewState.ROOT_VIEW_NO_CHILDREN
          showSplashScreen()
        }
      }

      override fun onChildViewAdded(parent: View, child: View) {
        // react only to first child
        if (rootView?.childCount == 1) {
          rootViewState = RootViewState.ROOT_VIEW_HAS_CHILDREN
          if (autoHideEnabled) {
            hideSplashScreen()
          }
        }
      }
    })
  }

  /**
   * Indicates state of the root view that SplashScreen is operating on.
   */
  private enum class RootViewState {
    /**
     * Initial state
     * Looking for RootView that conforms to RootView class provided via [SplashScreen.show]
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

object Noop : () -> Unit, (String) -> Unit {
  override fun invoke() {}
  override fun invoke(reason: String) {}
}
