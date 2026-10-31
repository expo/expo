package expo.modules.keepawake

import android.app.Activity
import android.view.WindowManager
import expo.modules.kotlin.AppContext

class ExpoKeepAwakeManager(
  private val appContext: AppContext?
) {
  private val tags = mutableSetOf<String>()

  private val currentActivity: Activity?
    get() = appContext?.currentActivity

  val isActivated: Boolean
    get() = tags.isNotEmpty()

  fun activate(tag: String) {
    tags.add(tag)
    syncKeepScreenOnFlag()
  }

  fun deactivate(tag: String) {
    tags.remove(tag)
    syncKeepScreenOnFlag()
  }

  fun syncKeepScreenOnFlag() {
    val activity = currentActivity
    if (activity != null) {
      if (tags.isEmpty()) {
        activity.runOnUiThread {
          activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
      } else {
        activity.runOnUiThread {
          activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
      }
    }
  }
}
