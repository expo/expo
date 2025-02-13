package expo.modules.backgroundtask

import android.content.Context
import android.util.Log
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskConsumerInterface
import expo.modules.interfaces.taskManager.TaskExecutionCallback
import expo.modules.interfaces.taskManager.TaskInterface
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface

class BackgroundTaskConsumer(context: Context?, taskManagerUtils: TaskManagerUtilsInterface?) :
  TaskConsumer(context, taskManagerUtils), TaskConsumerInterface {

  companion object {
    private const val BACKGROUND_TASK_TYPE = "expo-background-task"
    private val TAG = BackgroundTaskConsumer::class.java.simpleName
  }

  private var task: TaskInterface? = null

  override fun taskType(): String {
    return BACKGROUND_TASK_TYPE
  }

  /**
   * Exposing the execute task function so that the BackgroundTaskWork (WorkManager Work unit)
   * can execute the inner task. A task is only executed if the app is in the background.
   * This only applies when the app is in release mode.
   */
  fun executeTask(callback: TaskExecutionCallback) {
    Log.d(TAG, "Executing task '${task?.name}'")
    taskManagerUtils.executeTask(task, null, callback)
  }

  override fun didRegister(task: TaskInterface) {
    Log.d(TAG, "didRegister: ${task.name}")
    this.task = task

    val intervalMinutes = getIntervalMinutes()
    BackgroundTaskScheduler.registerTask(intervalMinutes)
  }

  override fun didUnregister() {
    Log.d(TAG, "didUnregister: ${task?.name}")
    this.task = null
    BackgroundTaskScheduler.unregisterTask()
  }

  private fun getIntervalMinutes(): Long {
    val options = task?.options as? Map<String, Any?>
    return (options?.get("minimumInterval") as? Number)?.toLong()
      ?: BackgroundTaskScheduler.DEFAULT_INTERVAL_MINUTES
  }
}
