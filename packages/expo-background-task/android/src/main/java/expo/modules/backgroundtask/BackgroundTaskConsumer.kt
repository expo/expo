package expo.modules.backgroundtask

import android.content.Context
import android.util.Log
import com.facebook.react.common.build.ReactBuildConfig
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskConsumerInterface
import expo.modules.interfaces.taskManager.TaskExecutionCallback
import expo.modules.interfaces.taskManager.TaskInterface
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface
import expo.modules.interfaces.taskManager.TaskServiceProviderHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BackgroundTaskConsumer(context: Context?, taskManagerUtils: TaskManagerUtilsInterface?) :
  TaskConsumer(context, taskManagerUtils), TaskConsumerInterface, LifecycleEventListener {
  companion object {
    const val BACKGROUND_TASK_TYPE: String = "expo-background-task"
    const val DEFAULT_INTERVAL_MINUTES: Long = 60 * 24 // Once every day
    private val TAG: String = BackgroundTaskConsumer::class.java.simpleName
  }
  private var mTask: TaskInterface? = null
  private var mBackgrounded: Boolean = true
  private val taskCoroutineScope = CoroutineScope(Dispatchers.Default)

  override fun taskType(): String {
    return BACKGROUND_TASK_TYPE
  }

  /**
   * Exposing the execute task function so that the BackgroundTaskWork (WorkManager Work unit)
   * can execute the inner task. A task is only executed if the app is in the background.
   * This only applies when the app is in release mode.
   */
  fun executeTask(callback: TaskExecutionCallback) {
    if (mBackgrounded || ReactBuildConfig.DEBUG) {
      taskManagerUtils.executeTask(mTask, null, callback)
    } else {
      Log.w(TAG, "Task was not executed since the app was not in the background or in Debug mode.")
    }
  }

  override fun didRegister(task: TaskInterface) {
    mTask = task

    Log.i(TAG, "didRegister: ${task.name}")

    // Make sure to schedule and set up the worker if it is not running
    taskCoroutineScope.launch {
      val context = context
      if (!BackgroundTaskScheduler.isWorkerRunning(context)) {
        // Get interval for the task
        val intervalMinutes = getIntervalMinutes()
        // Start worker
        Log.i(TAG, "didRegister: worker not running - starting worker.")
        BackgroundTaskScheduler.startWorker(context, task.appScopeKey, intervalMinutes)
      } else {
        Log.i(TAG, "didRegister: worker already running.")
      }
    }
  }

  override fun didUnregister() {
    Log.i(TAG, "didUnregister: ${mTask?.name}")

    taskCoroutineScope.launch {
      if (!BackgroundTaskScheduler.isWorkerRunning(context)) {
        return@launch
      }

      // Check if the task manager has more tasks like this
      val taskService = TaskServiceProviderHelper.getTaskServiceImpl(context.applicationContext)
        ?: throw MissingTaskServiceException()

      // Get tasks for our appScope
      val appScopeKey = mTask?.appScopeKey ?: throw MissingTaskException()
      mTask = null

      // Check if we have a task that
      val tasks = taskService.getTasksForAppScopeKey(appScopeKey)
      val ourTasks = tasks.filter { it.getString("taskType") == BACKGROUND_TASK_TYPE }
      if (ourTasks.isEmpty()) {
        Log.i(TAG, "didUnregister: ${mTask?.name} - stopping worker, no more $BACKGROUND_TASK_TYPE tasks running.")
        taskCoroutineScope.launch {
          // We should just stop the worker
          BackgroundTaskScheduler.stopWorker(context)
        }
      } else {
        Log.i(TAG, "didRegister: Leaving worker running.")
      }
    }
  }

  override fun onHostResume() {
    mBackgrounded = false
  }

  override fun onHostPause() {
    mBackgrounded = true
  }

  override fun onHostDestroy() {
    // Do nothing
  }

  private fun getIntervalMinutes(): Long {
    val options = if (mTask != null) mTask!!.options else null

    if (options != null && options.containsKey("minimumInterval")) {
      // minimumInterval option is in minutes
      return (options["minimumInterval"] as Number).toLong()
    }
    return BackgroundTaskConsumer.DEFAULT_INTERVAL_MINUTES
  }
}