package expo.modules.keepawake

import android.app.Activity
import android.view.WindowManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class ExpoKeepAwakeManager(
  private val activityProvider: () -> Activity
) {
  private val tags = mutableSetOf<String>()

  val isActivated: Boolean
    get() = tags.isNotEmpty()

  suspend fun activate(tag: String): Unit = withContext(Dispatchers.Main) {
    val activity = activityProvider()
    if (!isActivated) {
      activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }
    tags.add(tag)
  }

  suspend fun deactivate(tag: String): Unit = withContext(Dispatchers.Main) {
    val activity = activityProvider()
    if (tags.size == 1 && tags.contains(tag)) {
      activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }
    tags.remove(tag)
  }
}
