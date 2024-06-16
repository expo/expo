package expo.modules.backgroundfetch

import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TaskMangerInterfaceNotFoundException : CodedException(message = "TaskManagerInterface not found")

class BackgroundFetchModule : Module() {
  private val _taskManager by lazy { appContext.legacyModule<TaskManagerInterface>() }
  private val taskManager: TaskManagerInterface
    get() = _taskManager ?: throw TaskMangerInterfaceNotFoundException()

  override fun definition() = ModuleDefinition {
    Name("ExpoBackgroundFetch")

    AsyncFunction("registerTaskAsync") { taskName: String, options: Map<String, Any?> ->
      taskManager.registerTask(taskName, BackgroundFetchTaskConsumer::class.java, options)
    }

    AsyncFunction("unregisterTaskAsync") { taskName: String ->
      taskManager.unregisterTask(taskName, BackgroundFetchTaskConsumer::class.java)
    }
  }
}
