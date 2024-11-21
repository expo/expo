package expo.modules.backgroundtask

import android.content.Context
import android.util.Log
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
  TaskConsumer(context, taskManagerUtils), TaskConsumerInterface {
  companion object {
    const val BACKGROUND_TASK_TYPE: String = "expo-background-task"
    private val TAG: String = BackgroundTaskConsumer::class.java.simpleName
  }
  private var mTask: TaskInterface? = null
  private val taskCoroutineScope = CoroutineScope(Dispatchers.Default)

  override fun taskType(): String {
    return BACKGROUND_TASK_TYPE
  }

  fun executeTask(context: Context, callback: TaskExecutionCallback) {
    // Check if we're loading as a react application or if we are loading from
    // the background TODO:
    
    taskManagerUtils.executeTask(mTask, null, callback)
  }

  override fun didRegister(task: TaskInterface) {
    mTask = task

    Log.i(TAG, "didRegister: ${task.name}")

    // Make sure to schedule and set up the worker if it is not running
    taskCoroutineScope.launch {
      val context = context
      if (!BackgroundTaskScheduler.isWorkerRunning(context)) {
        // Start worker
        Log.i(TAG, "didRegister: worker not running - starting worker.")
        BackgroundTaskScheduler.startWorker(context, task.appScopeKey)
      }
    }
  }

  override fun didUnregister() {
    Log.i(TAG, "didUnregister: ${mTask?.name}")

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
    }
  }
}