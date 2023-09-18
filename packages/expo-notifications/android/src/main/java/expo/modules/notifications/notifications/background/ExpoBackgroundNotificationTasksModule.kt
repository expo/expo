package expo.modules.notifications.notifications.background

import android.content.Context
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.interfaces.taskManager.TaskManagerInterface

class ExpoBackgroundNotificationTasksModule(context: Context?) : ExportedModule(context) {
  private lateinit var taskManager: TaskManagerInterface
  override fun getName(): String = "ExpoBackgroundNotificationTasksModule"

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    taskManager = moduleRegistry.getModule(TaskManagerInterface::class.java)
  }

  @ExpoMethod
  fun registerTaskAsync(taskName: String?, promise: Promise) {
    try {
      taskManager.registerTask(
        taskName,
        BackgroundRemoteNotificationTaskConsumer::class.java,
        emptyMap()
      )
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun unregisterTaskAsync(taskName: String?, promise: Promise) {
    try {
      taskManager.unregisterTask(
        taskName,
        BackgroundRemoteNotificationTaskConsumer::class.java
      )
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject(e)
    }
  }
}
