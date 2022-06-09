package expo.modules.test.core

import expo.modules.kotlin.ModuleHolder
import expo.modules.kotlin.events.EventName

interface ModuleController {
  fun onCreate()
  fun onDestroy()
  fun onActivityEntersForeground()
  fun onActivityEntersBackground()
  fun onActivityDestroys()
}

class ModuleControllerImpl(private val holder: ModuleHolder) : ModuleController {
  override fun onCreate() {
    holder.post(EventName.MODULE_CREATE)
  }

  override fun onDestroy() {
    holder.post(EventName.MODULE_DESTROY)
  }

  override fun onActivityEntersForeground() {
    holder.post(EventName.ACTIVITY_ENTERS_FOREGROUND)
  }

  override fun onActivityEntersBackground() {
    holder.post(EventName.ACTIVITY_ENTERS_BACKGROUND)
  }

  override fun onActivityDestroys() {
    holder.post(EventName.ACTIVITY_DESTROYS)
  }
}
