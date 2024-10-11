package expo.modules.backgroundtask

import kotlinx.coroutines.CompletableDeferred

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
    public fun markTaskAsFinished() {

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
    public fun setRunTasksHandler(handler: () -> Unit) {

    }

    /**
     If we have a continuation object and a task handler we're pending a task run and should schedule it.
     The BackgroundTaskModule should perform this check when it starts the worker caused by one or more
     JS tasks being waiting
     */
    public fun checkForPendingTaskWorkerRequests() {

    }

    /**
     Clears the runTaskHandler. This should be done from the BackgroundTaskModule's onDestroy callback so that it is
     symmetric with the setRunTasksHandler
     */
    public fun clearRunTasksHandler() {

    }

    /**
     Returns true if background tasks are supported
     */
    public fun isBackgroundTaskSupported(): Boolean {
      return true
    }

    /**
     Checks to see if we have a runTaskHandler - which means that we're already initialised and have a valid
     appContext - we can just call it directly. If not we'll just create the continuation object and let the module
     grab it when it is loaded.
     */
    public fun tryCallTaskHandler() {

    }

    /**
     LaunchHandler for the BGTaskScheduler. This function is passed to the registration code of the BGTaskScheduler on startup.
     The function will not return until we've
     */
    public fun launchHandler(work: BackgroundTaskWork) {

    }
  }
}