package expo.modules.observe

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.ForegroundInfo
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import expo.modules.appmetrics.storage.SessionManager

/**
 * Background worker that dispatches stored metrics and logs to EAS Observe.
 */
class ObservabilityBackgroundWorker(
  context: Context,
  params: WorkerParameters
) : CoroutineWorker(context, params) {
  private val observabilityManager: BaseObservabilityManager? = run {
    val projectId = inputData.getString("projectId")
    val baseUrl = inputData.getString("baseUrl")

    if (projectId == null || baseUrl == null) {
      return@run null
    }

    val sessionManager = SessionManager(
      context = context
    )

    BaseObservabilityManager(
      context = context,
      projectId = projectId,
      sessionManager = sessionManager,
      baseUrl = baseUrl,
      isDebugBuild = BuildConfig.DEBUG
    )
  }

  override suspend fun getForegroundInfo(): ForegroundInfo {
    val channelId = "expo-observe-background"
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(channelId, "Metrics dispatch", NotificationManager.IMPORTANCE_LOW)
      val manager = applicationContext.getSystemService(NotificationManager::class.java)
      manager.createNotificationChannel(channel)
    }
    val notification = NotificationCompat.Builder(applicationContext, channelId)
      .setSmallIcon(android.R.drawable.ic_popup_sync)
      .setContentTitle("Sending metrics")
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()
    return ForegroundInfo(WORK_NAME.hashCode(), notification)
  }

  override suspend fun doWork(): Result {
    return try {
      if (observabilityManager == null) {
        Log.e(OBSERVE_TAG, "ObservabilityManager is null - missing projectId or baseUrl")
        return Result.failure()
      }

      // We don't want to send old metrics, so we clean up first
      // This also adds a side benefit of cleaning up even if dispatch fails
      observabilityManager.cleanup()
      observabilityManager.dispatchUnsentMetrics()
      observabilityManager.dispatchUnsentLogs()
      Log.d(OBSERVE_TAG, "Successfully dispatched unsent metrics and logs")
      Result.success()
    } catch (e: Exception) {
      Log.e(OBSERVE_TAG, "Failed to dispatch metrics", e)
      // Retry with exponential backoff
      Result.retry()
    }
  }

  companion object {
    private const val WORK_NAME = "eas-observe-dispatch"

    fun scheduleBackgroundDispatch(
      context: Context,
      projectId: String,
      baseUrl: String
    ) {
      val constraints = Constraints
        .Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

      val data = workDataOf(
        Pair("projectId", projectId),
        Pair("baseUrl", baseUrl)
      )

      val periodicWork = OneTimeWorkRequestBuilder<ObservabilityBackgroundWorker>()
        .setConstraints(constraints)
        .setInputData(data)
        .build()

      WorkManager
        .getInstance(context)
        .enqueueUniqueWork(
          WORK_NAME,
          // Keep an in-flight dispatch; cancelling it can duplicate a request the server received.
          ExistingWorkPolicy.KEEP,
          periodicWork
        )
    }
  }
}
