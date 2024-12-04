package expo.modules.backgroundtask

import android.util.Log
import com.facebook.react.common.build.ReactBuildConfig
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.kotlin.functions.Coroutine
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

    AsyncFunction("triggerTaskWorkerForTestingAsync") Coroutine { ->
      if (ReactBuildConfig.DEBUG) {
        Log.i(TAG, "Triggering tasks for testing")
        appContext.reactContext?.let {
          val appScopeKey = it.packageName
          BackgroundTaskScheduler.runTasks(it, appScopeKey)
        } ?: throw MissingContextException()
      }
    }

    AsyncFunction("registerTaskAsync") { taskName: String, options: Map<String, Any?> ->
      Log.i(TAG, "registerTaskAsync: $taskName")
      taskManager.registerTask(taskName, BackgroundTaskConsumer::class.java, options)
    }

    AsyncFunction("unregisterTaskAsync") { taskName: String ->
      Log.i(TAG, "unregisterTaskAsync: $taskName")
      taskManager.unregisterTask(taskName, BackgroundTaskConsumer::class.java)
    }
  }
}

