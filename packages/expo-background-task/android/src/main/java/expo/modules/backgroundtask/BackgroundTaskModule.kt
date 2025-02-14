package expo.modules.backgroundtask

import android.util.Log
import com.facebook.react.common.build.ReactBuildConfig
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.runBlocking

class BackgroundTaskModule : Module() {
  companion object {
    private val TAG = BackgroundTaskModule::class.java.simpleName
  }

  private val _taskManager by lazy { appContext.legacyModule<TaskManagerInterface>() }
  private val taskManager: TaskManagerInterface
    get() = _taskManager ?: throw TaskMangerInterfaceNotFoundException()

  override fun definition() = ModuleDefinition {
    Name("ExpoBackgroundTask")

    AsyncFunction("getStatusAsync") {
      return@AsyncFunction 2 // WorkManager is always available on Android.
    }

    AsyncFunction("triggerTaskWorkerForTestingAsync") Coroutine { ->
      if (ReactBuildConfig.DEBUG) {
        Log.d(TAG, "Triggering tasks for testing")
        appContext.reactContext?.let {
          val appScopeKey = it.packageName
          return@Coroutine BackgroundTaskScheduler.runTasks(it, appScopeKey)
        } ?: throw MissingContextException()
      } else {
        throw TestMethodNotAvailableInProductionBuild()
      }
    }

    AsyncFunction("registerTaskAsync") { taskName: String, options: Map<String, Any?> ->
      Log.d(TAG, "registerTaskAsync: $taskName")
      taskManager.registerTask(taskName, BackgroundTaskConsumer::class.java, options)
    }

    AsyncFunction("unregisterTaskAsync") { taskName: String ->
      Log.d(TAG, "unregisterTaskAsync: $taskName")
      taskManager.unregisterTask(taskName, BackgroundTaskConsumer::class.java)
    }

    OnActivityEntersBackground {
      appContext.reactContext?.let {
        runBlocking {
          val appScopeKey = it.packageName
          BackgroundTaskScheduler.scheduleWorker(it, appScopeKey)
        }
      } ?: throw MissingContextException()
    }

    OnActivityEntersForeground {
      appContext.reactContext?.let {
        runBlocking {
          BackgroundTaskScheduler.stopWorker(it)
        }
      } ?: throw MissingContextException()
    }
  }
}
