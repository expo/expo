package expo.modules.taskManager

import android.os.Handler
import android.os.Looper
import expo.modules.core.errors.ModuleNotFoundException
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.interfaces.taskManager.TaskServiceInterface
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class TaskManagerModule : Module() {
  private val _taskService: TaskServiceInterface? by lazy {
    appContext.legacyModuleRegistry.getSingletonModule("TaskService", TaskServiceInterface::class.java)
  }
  private val taskService: TaskServiceInterface
    get() = _taskService
      ?: throw ModuleNotFoundException(TaskServiceInterface::class.java.toString())

  private val taskManagerInternal: TaskManagerInterface? by lazy {
    appContext.legacyModule()
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoTaskManager")

    Events(TaskManagerInterface.EVENT_NAME)

    Constants(
      "EVENT_NAME" to TaskManagerInterface.EVENT_NAME
    )

    AsyncFunction("isAvailableAsync") {
      return@AsyncFunction true
    }

    AsyncFunction("notifyTaskFinishedAsync") { taskName: String, response: Map<String, Any?> ->
      taskService.notifyTaskFinished(taskName, appScopeKey, response)
    }

    AsyncFunction("isTaskRegisteredAsync") { taskName: String ->
      taskService.hasRegisteredTask(taskName, appScopeKey)
    }

    AsyncFunction("getTaskOptionsAsync") { taskName: String ->
      taskService.getTaskOptions(taskName, appScopeKey)
    }

    AsyncFunction("getRegisteredTasksAsync") {
      taskService.getTasksForAppScopeKey(appScopeKey)
    }

    AsyncFunction("unregisterTaskAsync") { taskName: String ->
      taskService.unregisterTask(taskName, appScopeKey, null)
    }

    AsyncFunction("unregisterAllTasksAsync") {
      taskService.unregisterAllTasksForAppScopeKey(appScopeKey)
    }

    OnStartObserving {
      val handler = Handler(Looper.getMainLooper())
      handler.postDelayed(
        {
          taskManagerInternal?.flushQueuedEvents()
        },
        1000
      )
    }
  }

  private val appScopeKey: String
    get() = (
      taskManagerInternal
        ?: throw ModuleNotFoundException(TaskManagerInterface::class.java.toString())
      ).appScopeKey
}
