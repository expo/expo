package expo.modules.keepawake

import android.app.Activity
import android.view.WindowManager
import expo.modules.core.ModuleRegistry
import expo.modules.core.errors.CurrentActivityNotFoundException
import expo.modules.core.interfaces.ActivityProvider
import expo.modules.core.interfaces.InternalModule
import expo.modules.core.interfaces.services.KeepAwakeManager

class ExpoKeepAwakeManager : KeepAwakeManager, InternalModule {
  private val tags: MutableSet<String> = HashSet()

  private lateinit var moduleRegistry: ModuleRegistry

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    this.moduleRegistry = moduleRegistry
  }

  @get:Throws(CurrentActivityNotFoundException::class)
  private val currentActivity: Activity
    get() {
      val activityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
        ?: throw CurrentActivityNotFoundException()
      return if (activityProvider.currentActivity != null) {
        activityProvider.currentActivity
      } else {
        throw CurrentActivityNotFoundException()
      }
    }

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

  override fun getExportedInterfaces(): List<Class<*>?> {
    return listOf(KeepAwakeManager::class.java)
  }
}
