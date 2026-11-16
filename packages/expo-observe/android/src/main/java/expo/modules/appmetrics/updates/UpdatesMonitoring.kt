package expo.modules.appmetrics.updates

import android.util.Log
import expo.modules.appmetrics.AppMetrics
import expo.modules.appmetrics.AppUpdatesInfo
import expo.modules.appmetrics.MetricCategory
import expo.modules.appmetrics.TAG
import expo.modules.appmetrics.storage.Metric
import expo.modules.appmetrics.storage.SessionHandle
import expo.modules.appmetrics.utils.TimeUtils

/**
 * Provides updates-related metric helpers.
 * The subscription lifecycle and state change listening are managed by AppMetricsModule.
 */
internal class UpdatesMonitoring(
  private val session: SessionHandle
) {

  /**
   * Returns the current updates info (update ID, runtime version, request headers) for the
   * launched app, or an empty info object when updates is not available.
   */
  fun getUpdatesMetricsInfo(): AppUpdatesInfo {
    val info = AppMetrics.host.updatesInfo()
    return info.copy(updateId = info.updateId?.lowercase())
  }

  /**
   * Patches the app metadata with the OTA updates info if applicable.
   */
  fun patchAppInfoIfNeeded(currentMetadata: expo.modules.appmetrics.AppMetadata?): expo.modules.appmetrics.AppMetadata? {
    if (currentMetadata == null) {
      return currentMetadata
    }
    val updatesInfo = getUpdatesMetricsInfo()
    if (updatesInfo.updateId == null && updatesInfo.runtimeVersion == null) {
      return currentMetadata
    }
    if (currentMetadata.appUpdatesInfo?.updateId != null) {
      return currentMetadata
    }
    Log.d(TAG, "OTA update info found, patching AppMetadata")
    return currentMetadata.copy(appUpdatesInfo = updatesInfo)
  }

  /** Builds the metric for an update download that took `downloadTimeSeconds`. */
  fun downloadTimeMetric(downloadTimeSeconds: Double, updateId: String): Metric {
    return Metric(
      sessionId = session.sessionId,
      timestamp = TimeUtils.getCurrentTimestampInISOFormat(),
      category = MetricCategory.Updates.categoryName,
      name = "updateDownloadTime",
      value = downloadTimeSeconds,
      updateId = updateId
    )
  }
}
