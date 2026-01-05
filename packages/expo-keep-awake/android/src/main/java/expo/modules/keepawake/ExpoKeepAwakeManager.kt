package expo.modules.keepawake

import android.app.Activity
import android.view.WindowManager
import expo.modules.core.errors.CurrentActivityNotFoundException
import expo.modules.core.interfaces.services.KeepAwakeManager
import expo.modules.kotlin.AppContext

class ExpoKeepAwakeManager(private val appContext: AppContext?) : KeepAwakeManager {
  private val tags: MutableSet<String> = HashSet()

  @get:Throws(CurrentActivityNotFoundException::class)
  private val currentActivity: Activity
    get() = appContext?.currentActivity ?: throw CurrentActivityNotFoundException()

  @Throws(CurrentActivityNotFoundException::class)
  override fun activate(tag: String, done: Runnable) {
    val activity = currentActivity
    if (!isActivated) {
      activity.runOnUiThread { activity.window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) }
    }
    tags.add(tag)
    done.run()
  }

  @Throws(CurrentActivityNotFoundException::class)
  override fun deactivate(tag: String, done: Runnable) {
    val activity = currentActivity
    if (tags.size == 1 && tags.contains(tag)) {
      activity.runOnUiThread { activity.window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON) }
    }
    tags.remove(tag)
    done.run()
  }

  override fun isActivated(): Boolean {
    return tags.isNotEmpty()
  }
}
