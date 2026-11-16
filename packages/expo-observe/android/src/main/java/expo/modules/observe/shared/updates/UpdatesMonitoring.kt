package expo.modules.observe.shared.updates

import android.util.Log
import expo.modules.observe.shared.AppMetrics
import expo.modules.observe.shared.MetricCategory
import expo.modules.observe.shared.TAG
import expo.modules.observe.shared.storage.Metric
import expo.modules.observe.shared.storage.SessionHandle
import expo.modules.observe.shared.utils.TimeUtils

internal data class UpdateDownload(val timeSeconds: Double, val updateId: String)

/**
 * Provides updates-related metric helpers.
 * The subscription lifecycle and state change listening are managed by AppMetricsModule.
 */
internal class UpdatesMonitoring(
  private val session: SessionHandle
) {

  /**
   * Patches the app metadata with the OTA updates info if applicable.
   */
  fun patchAppInfoIfNeeded(currentMetadata: expo.modules.observe.shared.AppMetadata?): expo.modules.observe.shared.AppMetadata? {
    if (currentMetadata == null) {
      return currentMetadata
    }
    val updatesInfo = AppMetrics.host.updatesInfo()
    if (updatesInfo.updateId == null && updatesInfo.runtimeVersion == null) {
      return currentMetadata
    }
    if (currentMetadata.appUpdatesInfo?.updateId != null) {
      return currentMetadata
    }
    Log.d(TAG, "OTA update info found, patching AppMetadata")
    return currentMetadata.copy(appUpdatesInfo = updatesInfo)
  }

  /** Builds the metric for `download`. */
  fun downloadTimeMetric(download: UpdateDownload): Metric {
    return Metric(
      sessionId = session.sessionId,
      timestamp = TimeUtils.getCurrentTimestampInISOFormat(),
      category = MetricCategory.Updates.categoryName,
      name = "updateDownloadTime",
      value = download.timeSeconds,
      updateId = download.updateId
    )
  }
}
