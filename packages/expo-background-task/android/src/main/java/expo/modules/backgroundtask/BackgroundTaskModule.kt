package expo.modules.backgroundtask

import android.util.Log
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val PERFORM_WORK_EVENT_NAME = "onPerformWork"

class BackgroundTaskModule : Module() {
  companion object {
    private const val MODULE_NAME: String = "ExpoBackgroundTask"
    private val TAG: String = BackgroundTaskModule::class.java.simpleName
  }

  override fun definition() = ModuleDefinition {
    Name(MODULE_NAME)
    Events(PERFORM_WORK_EVENT_NAME)
    Constants("EVENT_PERFORM_WORK" to PERFORM_WORK_EVENT_NAME)

    OnCreate {
      Log.i(TAG, "Background Task Manager Module created - adding callback.")
      BackgroundTaskService.setRunTasksHandler {
        Log.i(TAG, "Background Task Manager Module got callback, ready to notify JS.")
        sendEvent(PERFORM_WORK_EVENT_NAME)
      }
    }

    OnDestroy {
      Log.i(TAG, "Background Task Manager Module destroyed - removing callback.")
      BackgroundTaskService.clearRunTasksHandler()
    }

    AsyncFunction("startWorkerAsync") Coroutine { ->
      appContext.reactContext?.let { BackgroundTaskScheduler.tryScheduleWorker(it) } ?: throw MissingAppContextException()
    }

    AsyncFunction("stopWorkerAsync") Coroutine { ->
      appContext.reactContext?.let { BackgroundTaskScheduler.stopWorker(it) } ?: throw MissingAppContextException()
    }

    AsyncFunction("isWorkerRunningAsync") Coroutine { ->
      return@Coroutine BackgroundTaskScheduler.isWorkerRunning(appContext)
    }

    AsyncFunction("initialiseFromJS") { ->
      BackgroundTaskService.checkForPendingTaskWorkerRequests()
    }

    AsyncFunction("getStatusAsync") {
      return@AsyncFunction 2 // Always working on Android.
    }

    AsyncFunction("workFinished") {
      BackgroundTaskService.markTaskAsFinished()
      // No need to re-schedule, our worker is automatically repeating
    }
  }
}

