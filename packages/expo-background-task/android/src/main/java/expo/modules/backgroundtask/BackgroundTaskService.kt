package expo.modules.backgroundtask

import android.util.Log
import kotlinx.coroutines.CompletableDeferred
import androidx.work.ListenableWorker.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking

class BackgroundTaskService {
  companion object {
    // Log tag
    private val TAG: String = BackgroundTaskScheduler::class.java.simpleName

    /*
     Callback for handling background tasks. This callback can be set from the BackgroundTaskModule
     and will be called when we receive a notification that we should run a task in the background
     from the OS
    */
    private var runTasksHandler: (() -> Unit)? = null

    /**
     Completable that will be marked as done when the JS side is ready and done with running tasks.
     */
    private var runTasksCompletable : CompletableDeferred<Boolean>? = null

    /**
     This function should be called when the BackgroundTaskModule is notified by JS that the task runner has
     finished. We'll then notify the waiting task handler about this
     */
    fun markTaskAsFinished() {
      Log.i(TAG, "Marking task as finished")
      if (runTasksCompletable != null) {
        runTasksCompletable!!.complete(true)
        runTasksCompletable = null
      } else {
        // This should never happen - one shouldn't mark a task that was never finished
        // as done...
        throw InvalidFinishTaskRun()
      }
    }

    /**
    Sets the callback function that is called when the background task handler is called from the OS.
    If this function is not set we'll set the runTaskContinunation object and wait until everything is loaded
    The BackgroundTaskModule will then check for the continuation object and perform a task run when ready.

    Should be called from the BackgroundTaskModule's onCreate callback.

    This function will also check if there is any tasks waiting - and call the task handler if it is

    NOTE: If there is already a handler we won't set it again - setting should be symmetric and follow the onCreate/onDestroy
    from the calling module
     */
    fun setRunTasksHandler(handler: () -> Unit) {
      Log.i(TAG, "setting task handler callback")
      // 1. Only set the handler when no handler is set
      if (runTasksHandler == null)  {
        // 2. Save the handler
        runTasksHandler = handler
      }
    }

    /**
     If we have a continuation object and a task handler we're pending a task run and should schedule it.
     The BackgroundTaskModule should perform this check when it starts the worker caused by one or more
     JS tasks being waiting
     */
    fun checkForPendingTaskWorkerRequests() {
      Log.i(TAG, "Checking for pending task requests")
      // Check if we should call it if there are any pending tasks
      if (runTasksCompletable != null) {
        Log.i(TAG, "Found pending task requests")
        if (runTasksHandler != null) {
          val scope = CoroutineScope(Dispatchers.Default)
          scope.launch {
            // It is super important to run this on a separate thread since it might
            // take a lot of time
            try {
              runTasksHandler?.let { it() }
            } catch (e: Exception) {
              Log.i(TAG, "Executing background task failed with error ${e.message}")
            }
          }
        } else {
          Log.e(TAG, "Pending task found, no handler registered to run it")
        }
      } else {
        Log.i(TAG, "No pending task requests found")
      }
    }

    /**
     Clears the runTaskHandler. This should be done from the BackgroundTaskModule's onDestroy callback so that it is
     symmetric with the setRunTasksHandler
     */
    fun clearRunTasksHandler() {
      Log.i(TAG, "Clearing task handler callback")
      runTasksHandler = null
    }

    /**
     LaunchHandler for the BGTaskScheduler. This function is passed to the registration code of the BGTaskScheduler on startup.
     The function will not return until we're finished running the JS code.
     */
    fun launchHandler(work: BackgroundTaskWork): Result {
      Log.i(TAG,"Callback from OS for background task")

      // Check if we have an already running task
      if (runTasksCompletable != null) {
        // TODO: What should we do...!? We're already running.... Just return task completed?
        Log.i(TAG, "ExpoBackgroundTask: Already running - this task will be ignored")
        return Result.success()
      }

      return runBlocking {
        try {
          tryCallTaskHandler()
          Log.i(TAG, "BackgroundTask worker successfully finished.")
          return@runBlocking Result.success()
        } catch (e: Exception) {
          Log.e(TAG, "BackgroundTask worker failed with error " + e.message)
          return@runBlocking Result.failure()
        }
      }
    }

    /**
    Checks to see if we have a runTaskHandler - which means that we're already initialised and have a valid
    appContext - we can just call it directly. If not we'll just create the continuation object and let the module
    grab it when it is loaded.
     */
    private fun tryCallTaskHandler() {
      Log.i(TAG, "Setting up continuation and optionally calling handler")
      // 1. Create CompletableDeferred object
      runTasksCompletable = CompletableDeferred()

      // 2. Check if the handler is set
      if (runTasksHandler != null) {
        // 3. Call the handler
        Log.i(TAG, "Calling handler")
        val scope = CoroutineScope(Dispatchers.Default)
        scope.launch {
          // It is super important to run this on a separate thread since it might
          // take a lot of time
          try {
            runTasksHandler?.let { it() }
          } catch (e: Exception) {
            Log.i(TAG, "Executing background task failed with error ${e.message}")
          }
        }
      } else {
        print("ExpoBackgroundTask: Did not call handler since it was not set.")
      }
    }
  }
}