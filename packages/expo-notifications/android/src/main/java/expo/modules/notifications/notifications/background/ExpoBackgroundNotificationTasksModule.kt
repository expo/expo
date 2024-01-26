package expo.modules.notifications.notifications.background

import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.ModuleNotFoundException

class ExpoBackgroundNotificationTasksModule : Module() {
  private val taskManager: TaskManagerInterface by lazy {
    return@lazy appContext.legacyModule()
      ?: throw ModuleNotFoundException(TaskManagerInterface::class)
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoBackgroundNotificationTasksModule")

    AsyncFunction("registerTaskAsync") { taskName: String ->
      taskManager.registerTask(
        taskName,
        BackgroundRemoteNotificationTaskConsumer::class.java,
        emptyMap()
      )
    }

    AsyncFunction("unregisterTaskAsync") { taskName: String ->
      taskManager.unregisterTask(
        taskName,
        BackgroundRemoteNotificationTaskConsumer::class.java
      )
    }
  }
}
