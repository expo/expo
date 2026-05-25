package expo.modules.appmetrics.updates

import android.util.Log
import expo.modules.appmetrics.AppUpdatesInfo
import expo.modules.appmetrics.MetricCategory
import expo.modules.appmetrics.TAG
import expo.modules.appmetrics.storage.Metric
import expo.modules.appmetrics.utils.TimeUtils
import expo.modules.updatesinterface.UpdatesControllerRegistry
import expo.modules.updatesinterface.UpdatesNativeInterfaceStateContext
import expo.modules.updatesinterface.UpdatesStateChangeSubscription

/**
 * Provides updates-related metric helpers.
 * The subscription lifecycle and state change listening are managed by AppMetricsModule.
 */
class UpdatesMonitoring(
  private val sessionId: String
) {

  /**
   * Returns the current updates info (update ID, runtime version, request headers) for the
   * launched app, or an empty info object when updates is not available.
   */
  fun getUpdatesMetricsInfo(): AppUpdatesInfo {
    val controller = UpdatesControllerRegistry.controller?.get()
      ?: return AppUpdatesInfo(updateId = null, runtimeVersion = null, requestHeaders = null)
    val launchedUpdateId = controller.launchedUpdateId
    val embeddedUpdateId = controller.embeddedUpdateId
    // Ignore embedded launches – they are not available on the website anyway.
    val updateId = if (launchedUpdateId == embeddedUpdateId) null else launchedUpdateId?.toString()?.lowercase()
    return AppUpdatesInfo(
      updateId = updateId,
      runtimeVersion = controller.runtimeVersion,
      requestHeaders = controller.requestHeaders
    )
  }

  /**
   * Patches the app metadata with the OTA updates info if applicable.
   */
  fun patchAppInfoIfNeeded(currentMetadata: expo.modules.appmetrics.AppMetadata?): expo.modules.appmetrics.AppMetadata? {
    if (currentMetadata == null) return currentMetadata
    val updatesInfo = getUpdatesMetricsInfo()
    if (updatesInfo.updateId == null && updatesInfo.runtimeVersion == null) return currentMetadata
    if (currentMetadata.appUpdatesInfo?.updateId != null) return currentMetadata
    Log.d(TAG, "OTA update info found, patching AppMetadata")
    return currentMetadata.copy(appUpdatesInfo = updatesInfo)
  }

  /**
   * Builds a download time metric from the current subscription context, or returns null
   * if the required data is not available.
   */
  fun downloadTimeMetric(subscription: UpdatesStateChangeSubscription?): Metric? {
    val context = subscription?.getContext() as? UpdatesNativeInterfaceStateContext ?: return null
    val downloadedManifest = context.downloadedManifest ?: return null
    val updateId = downloadedManifest["id"] as? String ?: return null
    val startTime = context.downloadStartTime ?: return null
    val finishTime = context.downloadFinishTime ?: return null

    val downloadTimeSeconds = (finishTime.time - startTime.time).toDouble() / 1000.0

    return Metric(
      sessionId = sessionId,
      timestamp = TimeUtils.getCurrentTimestampInISOFormat(),
      category = MetricCategory.Updates.categoryName,
      name = "updateDownloadTime",
      value = downloadTimeSeconds,
      updateId = updateId
    )
  }
}
