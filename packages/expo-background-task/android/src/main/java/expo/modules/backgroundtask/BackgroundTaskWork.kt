package expo.modules.backgroundtask

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.Data
import androidx.work.WorkerParameters

class BackgroundTaskWork(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
  companion object {
    private val TAG: String = BackgroundTaskWork::class.java.simpleName
  }

  /**
   * The doWork function is called by the Android WorkManager to execute scheduled work.
   */
  override suspend fun doWork(): Result {
    Log.i(TAG, "doWork: Running worker")

    // Get the app scope key
    val appScopeKey = inputData.getString("appScopeKey") ?: throw MissingAppScopeKey()

    try {
      BackgroundTaskScheduler.runTasks(applicationContext, appScopeKey)
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