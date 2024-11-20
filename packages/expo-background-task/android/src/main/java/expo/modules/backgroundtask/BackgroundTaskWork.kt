package expo.modules.backgroundtask

import android.content.Context
import android.util.Log
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class BackgroundTaskWork(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
  companion object {
    private val TAG: String = BackgroundTaskWork::class.java.simpleName
  }

  override suspend fun doWork(): Result {
    Log.i(TAG, "BackgroundTask worker doWork called.")
    return BackgroundTaskService.launchHandler(this.applicationContext)
  }
}