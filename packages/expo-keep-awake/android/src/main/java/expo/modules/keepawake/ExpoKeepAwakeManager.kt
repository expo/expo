package expo.modules.keepawake

import android.app.Activity
import android.view.WindowManager
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.exception.Exceptions

class ExpoKeepAwakeManager(
  private val appContext: AppContext?
) {
  private val tags = mutableSetOf<String>()

  private val currentActivity: Activity
    get() = (appContext ?: throw Exceptions.AppContextLost()).throwingActivity

  val isActivated: Boolean
    get() = tags.isNotEmpty()

  fun activate(tag: String) {
    val activity = currentActivity
    if (!isActivated) {
      activity.runOnUiThread {
        activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      }
    }
    tags.add(tag)
  }

  fun deactivate(tag: String) {
    val activity = currentActivity
    if (tags.size == 1 && tags.contains(tag)) {
      activity.runOnUiThread {
        activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      }
    }
    tags.remove(tag)
  }
}
