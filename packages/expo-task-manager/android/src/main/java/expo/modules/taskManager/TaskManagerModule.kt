package expo.modules.taskManager

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import expo.modules.core.errors.ModuleNotFoundException
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.interfaces.taskManager.TaskServiceInterface
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.lang.ref.WeakReference

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

    OnCreate {
      // Slightly hacky way to be able to emit events using the new event emitter from legacy modules.
      val weakModule = WeakReference(this@TaskManagerModule)
      val emitEvent = { name: String, body: Bundle ->
        try {
          // It may throw, because RN event emitter may not be available
          // we can just ignore those cases
          weakModule.get()?.sendEvent(name, body)
        } catch (error: Throwable) {
          Log.e("ExpoTaskManager", "Failed to emit event $name using the module's event emitter: ${error.message}")
        }
        Unit
      }

      // For compatibility reasons, we don't want to edit TaskManagerInterface, as it's in the expo-modules-core package.
      // There is only one usage of the TaskManagerInterface and it's the TaskManagerInternalModule, so we can safely cast
      // to it and set it's emitEventWrapper.
      (appContext.legacyModule<TaskManagerInterface>() as? TaskManagerInternalModule)?.setEmitEventWrapper(emitEvent)
    }

    AsyncFunction<Boolean>("isAvailableAsync") {
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

    AsyncFunction<List<Bundle>>("getRegisteredTasksAsync") {
      taskService.getTasksForAppScopeKey(appScopeKey)
    }

    AsyncFunction("unregisterTaskAsync") { taskName: String ->
      taskService.unregisterTask(taskName, appScopeKey, null)
    }

    AsyncFunction<Unit>("unregisterAllTasksAsync") {
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
