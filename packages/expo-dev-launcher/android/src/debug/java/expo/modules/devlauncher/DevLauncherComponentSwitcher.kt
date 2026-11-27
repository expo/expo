package expo.modules.devlauncher

import android.app.Activity
import android.util.Log
import android.view.ViewGroup
import com.facebook.react.ReactActivity
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
    container: ViewGroup?,
    moduleName: String
  ): Boolean {
    if (activity == null || container == null) {
      Log.w(TAG, "Cannot switch component: missing activity/container.")
      return false
    }

    val reactDelegate = (activity as? ReactActivity)?.reactDelegate
    if (reactDelegate == null) {
      Log.w(TAG, "Cannot switch component: the activity has no ReactDelegate.")
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
      container.addView(
        newRootView,
        ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT
        )
      )
      true
    }
  }
}
