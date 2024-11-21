package expo.modules.backgroundtask

import android.util.Log
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BackgroundTaskModule : Module() {
  companion object {
    private const val MODULE_NAME: String = "ExpoBackgroundTask"
    private val TAG: String = BackgroundTaskModule::class.java.simpleName
  }

  private val _taskManager by lazy { appContext.legacyModule<TaskManagerInterface>() }
  private val taskManager: TaskManagerInterface
    get() = _taskManager ?: throw TaskMangerInterfaceNotFoundException()

  override fun definition() = ModuleDefinition {
    Name(MODULE_NAME)

    AsyncFunction("getStatusAsync") {
      return@AsyncFunction 2 // WorkManager is always available on Android.
    }

    AsyncFunction("registerTaskAsync") { taskName: String, options: Map<String, Any?> ->
      Log.e(TAG, "registerTaskAsync: $taskName")
      taskManager.registerTask(taskName, BackgroundTaskConsumer::class.java, options)
    }

    AsyncFunction("unregisterTaskAsync") { taskName: String ->
      Log.e(TAG, "unregisterTaskAsync: $taskName")
      taskManager.unregisterTask(taskName, BackgroundTaskConsumer::class.java)
    }
  }
}

