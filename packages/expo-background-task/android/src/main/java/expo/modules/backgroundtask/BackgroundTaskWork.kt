package expo.modules.backgroundtask

import android.content.Context
import android.os.Build
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.Data
import androidx.work.WorkerParameters

class BackgroundTaskWork(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
  companion object {
    private val TAG = BackgroundTaskWork::class.java.simpleName
  }

  /**
   * The doWork function is called by the Android WorkManager to execute scheduled work.
   */
  override suspend fun doWork(): Result {
    Log.i(TAG, "doWork: Running worker")

    // Get the app scope key
    val appScopeKey = inputData.getString("appScopeKey") ?: throw MissingAppScopeKey()

    try {
      // Run tasks async using the task service. This call will return when the task has finished
      // ie. When JS task executor has notified the task manager that it is done.
      BackgroundTaskScheduler.runTasks(applicationContext, appScopeKey)
      // If we are on a newer Android version we're using a One time request and need to spawn new
      // requests for each run (and also ask to not try to cancel the work, since we're already
      // finishing the work item when this function returns.
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        BackgroundTaskScheduler.scheduleWorker(applicationContext, appScopeKey, false)
      }
    } catch (e: Exception) {
      // Wrap exception in Data:
      val outputData = Data.Builder()
        .putString("error", e.message)
        .putString("stackTrace", e.stackTraceToString())
        .build()

      return Result.failure(outputData)
    }
    return Result.success()
  }
}
