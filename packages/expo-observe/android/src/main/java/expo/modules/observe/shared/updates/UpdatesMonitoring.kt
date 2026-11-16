package expo.modules.observe.shared.updates

import android.util.Log
import expo.modules.observe.shared.AppMetrics
import expo.modules.observe.shared.AppUpdatesInfo
import expo.modules.observe.shared.MetricCategory
import expo.modules.observe.shared.TAG
import expo.modules.observe.shared.storage.Metric
import expo.modules.observe.shared.storage.SessionHandle
import expo.modules.observe.shared.utils.TimeUtils

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
  fun patchAppInfoIfNeeded(currentMetadata: expo.modules.observe.shared.AppMetadata?): expo.modules.observe.shared.AppMetadata? {
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
