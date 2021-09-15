package expo.modules.keepawake

import android.app.Activity
import android.view.WindowManager

import expo.modules.core.interfaces.services.KeepAwakeManager
import expo.modules.core.interfaces.InternalModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.errors.CurrentActivityNotFoundException
import expo.modules.core.interfaces.ActivityProvider

import java.util.HashSet

class ExpoKeepAwakeManager(private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()) : KeepAwakeManager, InternalModule {
  private val tags: MutableSet<String> = HashSet()

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  @get:Throws(CurrentActivityNotFoundException::class)
  private val currentActivity: Activity
    get() {
      val activityProvider: ActivityProvider by moduleRegistry()
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
