// Copyright 2025-present 650 Industries. All rights reserved.

import EXUpdatesInterface
import Foundation

/// Reads the running update from expo-updates.
func expoUpdatesInfo() -> AppInfo.UpdatesInfo {
  guard let updatesController = UpdatesControllerRegistry.sharedInstance.controller else {
    return AppInfo.UpdatesInfo(
      updateId: nil,
      runtimeVersion: nil,
      requestHeaders: nil
    )
  }
  let launchedUpdateId = updatesController.launchedUpdateId
  let embeddedUpdateId = updatesController.embeddedUpdateId

  // Ignore embedded launches – they are not available on the website anyway.
  let updateId =
    launchedUpdateId == embeddedUpdateId
    ? nil
    : launchedUpdateId?.uuidString.lowercased()
  let runtimeVersion = updatesController.runtimeVersion
  let requestHeaders = updatesController.requestHeaders
  return AppInfo.UpdatesInfo(
    updateId: updateId,
    runtimeVersion: runtimeVersion,
    requestHeaders: requestHeaders
  )
}

/// The update download time metric that `subscription` reports, or `nil`.
func updateDownloadTimeMetric(_ subscription: UpdatesStateChangeSubscription?) -> Metric? {
  guard let subscription,
    let context = subscription.getContext() as? UpdatesNativeInterfaceStateContext,
    let updateId = context.downloadedManifest?["id"] as? String,
    let startTime = context.downloadStartTime,
    let finishTime = context.downloadFinishTime
  else {
    return nil
  }
  // expo-updates emits `downloadCompleteWithUpdate` for an update that is already downloaded and
  // ready on disk too. We don't want to write metrics for those events, so check for
  // downloadProgress > 0, which only happens on real asset downloads.
  if context.downloadProgress <= 0 {
    return nil
  }
  let lastDownloadTime = finishTime.timeIntervalSince(startTime)
  return Metric(
    category: .updates,
    name: "updateDownloadTime",
    value: lastDownloadTime,
    updateId: updateId
  )
}
