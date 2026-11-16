package expo.modules.observe

import expo.modules.observe.shared.AppUpdatesInfo
import expo.modules.updatesinterface.UpdatesControllerRegistry
import expo.modules.updatesinterface.UpdatesNativeInterfaceStateContext
import expo.modules.updatesinterface.UpdatesStateChangeSubscription

internal fun expoUpdatesInfo(): AppUpdatesInfo {
  val controller = UpdatesControllerRegistry.controller?.get()
    ?: return AppUpdatesInfo(updateId = null, runtimeVersion = null, requestHeaders = null)
  val launchedUpdateId = controller.launchedUpdateId
  val embeddedUpdateId = controller.embeddedUpdateId
  // Ignore embedded launches – they are not available on the website anyway.
  val updateId = if (launchedUpdateId == embeddedUpdateId) {
    null
  } else {
    launchedUpdateId?.toString()
  }
  return AppUpdatesInfo(
    updateId = updateId,
    runtimeVersion = controller.runtimeVersion,
    requestHeaders = controller.requestHeaders
  )
}

/**
 * The download time in seconds and the update id of the download that the subscription context
 * reports, or null if the required data is not available.
 */
internal fun updateDownload(subscription: UpdatesStateChangeSubscription?): Pair<Double, String>? {
  val context = subscription?.getContext() as? UpdatesNativeInterfaceStateContext ?: return null
  val downloadedManifest = context.downloadedManifest ?: return null
  val updateId = downloadedManifest["id"] as? String ?: return null
  val startTime = context.downloadStartTime ?: return null
  val finishTime = context.downloadFinishTime ?: return null
  // expo-updates emits `downloadCompleteWithUpdate` for an update that is already downloaded and
  // ready on disk too. We don't want to write metrics for those events, so check for
  // downloadProgress > 0, which only happens on real asset downloads.
  if (context.downloadProgress <= 0) {
    return null
  }
  return (finishTime.time - startTime.time).toDouble() / 1000.0 to updateId
}
