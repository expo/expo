package expo.modules.taskManager

import android.os.Handler
import expo.modules.core.errors.ModuleNotFoundException
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.interfaces.taskManager.TaskServiceInterface
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TaskManagerModule : Module() {
  private val taskService: TaskServiceInterface? by lazy {
    appContext.legacyModuleRegistry.getSingletonModule("TaskService", TaskServiceInterface::class.java)
  }
  private val taskManagerInternal: TaskManagerInterface? by lazy {
    appContext.legacyModule()
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoTaskManager")

    Constants(
      "EVENT_NAME" to TaskManagerInterface.EVENT_NAME
    )

    AsyncFunction("isAvailableAsync") {
      taskService != null
    }

    AsyncFunction("notifyTaskFinishedAsync") { taskName: String, response: Map<String, Any?> ->
      val taskService = ensuresTaskService()
      taskService.notifyTaskFinished(taskName, appScopeKey, response)
    }

    AsyncFunction("isTaskRegisteredAsync") { taskName: String ->
      val taskService = ensuresTaskService()
      taskService.hasRegisteredTask(taskName, appScopeKey)
    }

    AsyncFunction("getTaskOptionsAsync") { taskName: String ->
      val taskService = ensuresTaskService()
      taskService.getTaskOptions(taskName, appScopeKey)
    }

    AsyncFunction("getRegisteredTasksAsync") {
      val taskService = ensuresTaskService()
      taskService.getTasksForAppScopeKey(appScopeKey)
    }

    AsyncFunction("unregisterTaskAsync") { taskName: String ->
      val taskService = ensuresTaskService()
      taskService.unregisterTask(taskName, appScopeKey, null)
    }

    AsyncFunction("unregisterAllTasksAsync") {
      val taskService = ensuresTaskService()
      taskService.unregisterAllTasksForAppScopeKey(appScopeKey)
    }

    OnStartObserving {
      val handler = Handler()
      handler.postDelayed({
        taskManagerInternal?.flushQueuedEvents()
      }, 1000)
    }
  }

  private val appScopeKey: String
    private get() = (taskManagerInternal
      ?: throw ModuleNotFoundException(TaskManagerInterface::class.java.toString())).appScopeKey

  private fun ensuresTaskService(): TaskServiceInterface {
    return taskService
      ?: throw ModuleNotFoundException(TaskServiceInterface::class.java.toString())
  }
}
