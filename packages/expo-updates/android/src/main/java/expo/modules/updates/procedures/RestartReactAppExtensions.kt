package expo.modules.updates.procedures

import android.app.Activity
import com.facebook.react.ReactApplication
import com.facebook.react.common.LifecycleState
import com.facebook.react.config.ReactFeatureFlags

/**
 * An extension for [ReactApplication] to restart the app
 *
 * @param activity For bridgeless mode if the ReactHost is destroyed, we need an Activity to resume it.
 * @param reason The restart reason. Only used on bridgeless mode.
 */
internal fun ReactApplication.restart(activity: Activity?, reason: String) {
  if (ReactFeatureFlags.enableBridgelessArchitecture) {
    val reactHost = this.reactHost
    check(reactHost != null)
    if (reactHost.lifecycleState != LifecycleState.RESUMED && activity != null) {
      reactHost.onHostResume(activity)
    }
    reactHost.reload(reason)
    return
  }

  reactNativeHost.reactInstanceManager.recreateReactContextInBackground()
}
