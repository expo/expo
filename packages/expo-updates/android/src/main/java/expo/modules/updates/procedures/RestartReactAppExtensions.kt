package expo.modules.updates.procedures

import android.app.Activity
import android.content.Context
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.common.LifecycleState
import expo.modules.updates.UpdatesController
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread

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
  // After a fatal JS error, the host destroys its React instance and stops and detaches every
  // surface. `reload()` then creates a new instance but has no surface to restart, so nothing
  // renders and the splash screen is never hidden (for example, error recovery's fallback to an
  // older update). Once such a reload has completed, recreate the activity so that it starts a
  // new surface on the reloaded instance.
  val hostWasDestroyed = currentReactContext == null
  if (lifecycleState != LifecycleState.RESUMED && activity != null) {
    onHostResume(activity)
  }
  val reloadTask = reload(reason)
  if (hostWasDestroyed && activity != null) {
    thread(name = "expo-updates-restart") {
      // A failed reload destroys the host again; error recovery then continues as before.
      if (reloadTask.waitForCompletion(30, TimeUnit.SECONDS) && currentReactContext != null) {
        activity.runOnUiThread {
          if (!activity.isFinishing && !activity.isDestroyed) {
            activity.recreate()
          }
        }
      }
    }
  }
}
