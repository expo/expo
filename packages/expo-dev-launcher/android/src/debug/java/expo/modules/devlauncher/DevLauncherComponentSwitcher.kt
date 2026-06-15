package expo.modules.devlauncher

import android.app.Activity
import android.util.Log
import android.view.ViewGroup
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactDelegate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Re-mounts the host's React root view against a different AppRegistry
 * component, reusing the existing React host so the JS runtime stays alive.
 *
 * Called by the dev menu's `switchToComponentAction` hook. Mirrors the iOS
 * `ExpoDevLauncherReactDelegateHandler.switchAppRegistryComponent(to:)` flow:
 * recreate the root view via the same delegate that performed the initial
 * mount, then swap it into the container that already holds the dev menu
 * fragment overlay.
 */
internal object DevLauncherComponentSwitcher {
  private const val TAG = "DevLauncher"

  suspend fun switch(
    activity: Activity?,
    delegate: ReactActivityDelegate?,
    container: ViewGroup?,
    moduleName: String
  ): Boolean {
    if (activity == null || delegate == null || container == null) {
      Log.w(TAG, "Cannot switch component: missing activity/delegate/container.")
      return false
    }

    val reactDelegate = readReactDelegate(delegate)
    if (reactDelegate == null) {
      Log.w(TAG, "Cannot switch component: could not access ReactDelegate via reflection.")
      return false
    }

    return withContext(Dispatchers.Main) {
      val oldRootView = reactDelegate.reactRootView
      reactDelegate.unloadApp()
      reactDelegate.loadApp(moduleName)
      val newRootView = reactDelegate.reactRootView
      if (newRootView == null) {
        Log.w(TAG, "ReactDelegate did not produce a new root view for '$moduleName'.")
        return@withContext false
      }
      (oldRootView?.parent as? ViewGroup)?.removeView(oldRootView)
      (newRootView.parent as? ViewGroup)?.removeView(newRootView)
      // Match the layout that ReactActivityDelegateWrapper.loadAppImpl uses for the
      // initial mount: add the root view to the container without a specific index so
      // it sits in the same z-position as before.
      container.addView(newRootView, ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      ))
      true
    }
  }

  /**
   * `ReactDelegate` is owned by `ReactActivityDelegate` as a private `mReactDelegate`
   * ivar with only a protected `getReactDelegate()` accessor. We can't reflect on the
   * ivar directly because the delegate we capture here is normally expo-modules-core's
   * `ReactActivityDelegateWrapper`, whose own inherited `mReactDelegate` is null — the
   * real one lives on the inner wrapped delegate. Invoking `getReactDelegate()` via
   * reflection lets Kotlin's virtual dispatch route through the wrapper's override and
   * return the right `ReactDelegate` whether we're handed the wrapper or the inner.
   */
  private fun readReactDelegate(delegate: ReactActivityDelegate): ReactDelegate? =
	  runCatching {
	    val method = ReactActivityDelegate::class.java.getDeclaredMethod("getReactDelegate")
	    method.isAccessible = true
	    method.invoke(delegate) as? ReactDelegate
	  }.getOrElse { t ->
	    Log.w(TAG, "Failed to invoke ReactActivityDelegate.getReactDelegate", t)
	    null
	  }
}
