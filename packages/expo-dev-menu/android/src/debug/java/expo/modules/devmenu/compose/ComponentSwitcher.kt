package expo.modules.devmenu.compose

import android.app.Activity
import android.util.Log
import android.view.View
import android.view.ViewGroup
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.modules.appregistry.AppRegistry

/**
 * Locates the active React Native root view in the current activity and swaps the JS
 * component it renders by re-invoking `AppRegistry.runApplication` on the same
 * `rootTag`. The native view container, its layout, and the [com.facebook.react.ReactHost]
 * are left untouched — only the rendered JS tree changes.
 *
 * This avoids any view-hierarchy surgery and works without help from the host app,
 * which matters for brownfield integrations where the dev menu does not own the
 * fragment/activity it is rendering into.
 */
internal object ComponentSwitcher {
  private const val TAG = "ExpoDevMenu"

  fun currentModuleName(reactContext: ReactContext?): String? {
    val activity = reactContext?.currentActivity ?: return null
    return findReactRootView(activity)?.jsModuleName
  }

  /**
   * Returns `true` on success and `false` if no React root view, root tag, or running
   * React context could be resolved.
   */
  fun switchToComponent(reactContext: ReactContext?, moduleName: String): Boolean {
    if (reactContext == null) {
      Log.w(TAG, "switchToComponent called without an active ReactContext.")
      return false
    }
    val activity = reactContext.currentActivity
    if (activity == null) {
      Log.w(TAG, "switchToComponent called without a current Activity.")
      return false
    }
    val rootView = findReactRootView(activity)
    if (rootView == null) {
      Log.w(TAG, "Could not find an active ReactRootView to switch components.")
      return false
    }

    val rootTag = rootView.rootViewTag
    if (rootTag == 0) {
      Log.w(TAG, "Found a ReactRootView but its rootViewTag is 0 (not yet attached?).")
      return false
    }

    // Mirrors ReactRootView's own runApplication call: rootTag is a double, and
    // initialProps is only included when the host originally supplied them.
    val params = WritableNativeMap().apply {
      putDouble("rootTag", rootTag.toDouble())
      rootView.appProperties?.let {
        putMap("initialProps", Arguments.fromBundle(it))
      }
    }

    reactContext
      .getJSModule(AppRegistry::class.java)
      .runApplication(moduleName, params)
    return true
  }

  private fun findReactRootView(activity: Activity): ReactRootView? {
    val root = activity.window?.decorView ?: return null
    return search(root)
  }

  private fun search(view: View): ReactRootView? {
    if (view is ReactRootView) return view
    if (view is ViewGroup) {
      for (i in 0 until view.childCount) {
        val found = search(view.getChildAt(i))
        if (found != null) return found
      }
    }
    return null
  }
}
