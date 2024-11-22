package expo.modules.backgroundtask

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import expo.modules.interfaces.taskManager.TaskServiceProviderHelper
import kotlinx.coroutines.CompletableDeferred

class BackgroundTaskWork(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
  companion object {
    private val TAG: String = BackgroundTaskWork::class.java.simpleName
  }

  /**
   * The doWork function is called by the Android Work Manager to execute work. When we've scheduled
   * work this function can be called from :
   * 1) The WorkManager calls the function on a running app to execute any tasks
   * 2) The device was rebooted and the app is auto-started
   * 3) The app is started from the background
   */
  override suspend fun doWork(): Result {
    Log.i(TAG, "doWork: Starting worker")

    // Get task service
    val taskService = TaskServiceProviderHelper.getTaskServiceImpl(applicationContext)
      ?: return Result.failure()

    val appScopeKey = inputData.getString("appScopeKey") ?: throw MissingAppScopeKey()

    Log.i(TAG, "doWork: $appScopeKey")

    // Get all task consumers
    val consumers = taskService.getTaskConsumers(appScopeKey)
    Log.i(TAG, "doWork: number of consumers ${consumers.size}")

    val tasks = consumers.mapNotNull { consumer ->
      if (consumer.taskType() == BackgroundTaskConsumer.BACKGROUND_TASK_TYPE) {
        val bgTaskConsumer = (consumer as? BackgroundTaskConsumer) ?: throw InvalidBackgroundTaskConsumer()
        Log.i(TAG, "doWork: executing tasks for consumer of type ${consumer.taskType()}")

        val taskCompletion = CompletableDeferred<Unit>()

        bgTaskConsumer.executeTask(applicationContext) {
          Log.i(TAG, "Task successfully finished")
          taskCompletion.complete(Unit)
        }

        taskCompletion
      } else {
        null
      }
    }

    // Await all tasks to complete
    tasks.forEach { it.await() }

    // TODO: Wait until tasks are done?
    return Result.success()
  }
}