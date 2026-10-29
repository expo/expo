package expo.modules.keepawake

import android.app.Activity
import android.view.WindowManager

class ExpoKeepAwakeManager(
  private val activityProvider: () -> Activity
) {
  private val tags = mutableSetOf<String>()

  val isActivated: Boolean
    get() = tags.isNotEmpty()

  fun activate(tag: String) {
    val activity = activityProvider()
    if (!isActivated) {
      activity.runOnUiThread {
        activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      }
    }
    tags.add(tag)
  }

  fun deactivate(tag: String) {
    val activity = activityProvider()
    if (tags.size == 1 && tags.contains(tag)) {
      activity.runOnUiThread {
        activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      }
    }
    tags.remove(tag)
  }
}
