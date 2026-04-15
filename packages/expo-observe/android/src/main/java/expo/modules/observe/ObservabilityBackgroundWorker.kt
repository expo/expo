package expo.modules.observe

import android.content.Context
import android.util.Log
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import expo.modules.observe.storage.PendingMetricsManager
import expo.modules.appmetrics.storage.SessionManager

/**
 * Background worker that dispatches previously queued metrics to EAS Observe.
 *
 * This worker intentionally does NOT register a [SessionManager.MetricsInsertListener].
 * It only dispatches metrics that were already queued in the pending table by the foreground
 * [ObservabilityManager].
 */
class ObservabilityBackgroundWorker(
  context: Context,
  params: WorkerParameters
) : CoroutineWorker(context, params) {
  private val observabilityManager: BaseObservabilityManager? = run {
    val projectId = inputData.getString("projectId")
    val baseUrl = inputData.getString("baseUrl")
    val enableInDebug = inputData.getBoolean("enableInDebug", false)
    val useOpenTelemetry = inputData.getBoolean("useOpenTelemetry", false)

    if (projectId == null || baseUrl == null) {
      return@run null
    }

    val sessionManager = SessionManager(
      context = context
    )

    val pendingMetricsManager = PendingMetricsManager(context)

    BaseObservabilityManager(
      context = context,
      projectId = projectId,
      sessionManager = sessionManager,
      pendingMetricsManager = pendingMetricsManager,
      baseUrl = baseUrl,
      enableInDebug = enableInDebug,
      useOpenTelemetry = useOpenTelemetry
    )
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
      Log.d(OBSERVE_TAG, "Successfully dispatched unsent metrics")
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
      baseUrl: String,
      enableInDebug: Boolean = false,
      useOpenTelemetry: Boolean = false
    ) {
      val constraints = Constraints
        .Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()

      val data = workDataOf(
        Pair("projectId", projectId),
        Pair("baseUrl", baseUrl),
        Pair("enableInDebug", enableInDebug),
        Pair("useOpenTelemetry", useOpenTelemetry)
      )

      val periodicWork = OneTimeWorkRequestBuilder<ObservabilityBackgroundWorker>()
        .setConstraints(constraints)
        .setInputData(data)
        .build()

      WorkManager
        .getInstance(context)
        .enqueueUniqueWork(
          WORK_NAME,
          ExistingWorkPolicy.REPLACE,
          periodicWork
        )
    }
  }
}
