package expo.modules.backgroundtask

import android.content.Context
import android.os.Debug
import android.util.Log
import androidx.work.ListenableWorker.*
import com.facebook.react.ReactApplication
import expo.modules.apploader.AppLoaderProvider
import expo.modules.apploader.HeadlessAppLoader
import expo.modules.apploader.HeadlessAppLoader.AppConfigurationError
import expo.modules.core.interfaces.Consumer
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import okhttp3.internal.wait

class BackgroundTaskService {
  companion object {
    // AppLoader key
    private val APP_SCOPE_KEY = "expo-background-tasks"

    // Log tag
    private val TAG: String = BackgroundTaskScheduler::class.java.simpleName

    /**
     * Contains the headless app loader if started form the background
     */
    private var headlessAppLoader: HeadlessAppLoader? = null

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
        // Mark task as completed
        runTasksCompletable!!.complete(true)
        runTasksCompletable = null
        // We can tear down any appLoaders
        headlessAppLoader?.invalidateApp(APP_SCOPE_KEY)
        headlessAppLoader = null
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
      // Check if there are any pending tasks
      if (runTasksCompletable != null) {
        Log.i(TAG, "Found pending task requests")
        if (runTasksHandler != null) {
          CoroutineScope(Dispatchers.Default).launch {
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
    fun launchHandler(context: Context): Result {
      Log.i(TAG,"Callback from OS for background task")

      // Check if we have an already running task
      if (runTasksCompletable != null) {
        // TODO: What should we do...!? We're already running.... Just return task completed?
        Log.i(TAG, "ExpoBackgroundTask: Already running - this task will be ignored")
        return Result.failure()
      }

      Log.i(TAG, "Setting up continuation and optionally calling handler")

      // 1. Create CompletableDeferred object
      runTasksCompletable = CompletableDeferred()

      // 2. Check if the handler is set
      if (runTasksHandler != null) {
        // 3. Call the handler
        Log.i(TAG, "Calling handler")
        return runBlocking {
          try {
            runTasksHandler!!()
            return@runBlocking Result.success()
          } catch (e: Exception) {
            Log.i(TAG, "Executing background task failed with error ${e.message}")
            return@runBlocking Result.failure()
          }
        }
      } else {
        return runBlocking {
          Log.i(TAG, "Executing background task in headless mode")
          tryStartHeadless (context)
          if (runTasksCompletable != null) {
            runTasksCompletable?.await()
            return@runBlocking Result.success()
          } else {
            return@runBlocking Result.failure()
          }
        }
      }
    }

    private fun tryStartHeadless(context: Context) {
      Log.i(TAG, "Starting headless handling of task")

      if (headlessAppLoader == null) {
        CoroutineScope(Dispatchers.Main).launch {
          headlessAppLoader = AppLoaderProvider.getLoader("react-native-headless", context)
          try {
            headlessAppLoader?.loadApp(context, HeadlessAppLoader.Params(APP_SCOPE_KEY, ""),
              {}, { success: Boolean? ->
                if (!success!!) {
                  // Failed
                  Log.i(TAG, "failed")
                } else {
                  // Success
                  Log.i(TAG, "Headless loaded - wait for completion of task runner")
                }
              })
          } catch (e: Exception) {
            e.message?.let { Log.e(TAG, it) }
          }
        }
      }
    }
  }
}