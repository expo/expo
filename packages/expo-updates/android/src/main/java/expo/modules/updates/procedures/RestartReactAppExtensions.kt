package expo.modules.updates.procedures

import android.app.Activity
import android.content.Context
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.common.LifecycleState
import expo.modules.updates.UpdatesController

/**
 * Resolve a [ReactHost] to reload, in order of preference:
 *   1. `(context.applicationContext as? ReactApplication)?.reactHost`, works for every app
 *       whose host `Application` implements [ReactApplication].
 *   2. [UpdatesController.instance].reactHost, populated by the expo-modules-core
 *      `onDidCreateReactHost` lifecycle callback for brownfield consumers whose `Application`
 *      does not implement [ReactApplication].
 */
internal fun resolveReactHostForRestart(context: Context): ReactHost? =
  (context.applicationContext as? ReactApplication)?.reactHost
    ?: UpdatesController.instance.reactHost.get()

/**
 * An extension for [ReactHost] to restart the app
 *
 * @param activity For bridgeless mode if the ReactHost is destroyed, we need an Activity to resume it.
 * @param reason The restart reason. Only used on bridgeless mode.
 */
internal fun ReactHost.restart(activity: Activity?, reason: String) {
  if (lifecycleState != LifecycleState.RESUMED && activity != null) {
    onHostResume(activity)
  }
  reload(reason)
}
