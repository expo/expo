package expo.modules.appmetrics.updates

import android.util.Log
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
   * Returns the launched OTA update ID, or null if the app was launched from the embedded bundle.
   */
  fun getLaunchedUpdateId(): String? {
    val controller = UpdatesControllerRegistry.controller?.get() ?: return null
    val launchedUpdateId = controller.launchedUpdateId ?: return null
    val embeddedUpdateId = controller.embeddedUpdateId ?: return null

    // Ignore embedded launches
    if (launchedUpdateId == embeddedUpdateId) {
      return null
    }
    return launchedUpdateId.toString().lowercase()
  }

  fun getUpdateChannel(): String? {
    val controller = UpdatesControllerRegistry.controller?.get() ?: return null
    return controller.channel
  }

  fun getUpdateRuntimeVersion(): String? {
    val controller = UpdatesControllerRegistry.controller?.get() ?: return null
    return controller.runtimeVersion
  }

  /**
   * Patches the app metadata with the OTA update ID, channel, and runtime version if applicable.
   */
  fun patchAppInfoIfNeeded(currentMetadata: expo.modules.appmetrics.AppMetadata?): expo.modules.appmetrics.AppMetadata? {
    if (currentMetadata == null) return currentMetadata
    val updateId = getLaunchedUpdateId()
    val updateChannel = getUpdateChannel()
    val updateRuntimeVersion = getUpdateRuntimeVersion()
    if (updateId == null && updateChannel == null && updateRuntimeVersion == null) return currentMetadata
    if (currentMetadata.appUpdateId != null && currentMetadata.appUpdateChannel != null && currentMetadata.appUpdateRuntimeVersion != null) return currentMetadata
    Log.d(TAG, "OTA update info found, patching AppMetadata")
    return currentMetadata.copy(
      appUpdateId = currentMetadata.appUpdateId ?: updateId,
      appUpdateChannel = currentMetadata.appUpdateChannel ?: updateChannel,
      appUpdateRuntimeVersion = currentMetadata.appUpdateRuntimeVersion ?: updateRuntimeVersion
    )
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
