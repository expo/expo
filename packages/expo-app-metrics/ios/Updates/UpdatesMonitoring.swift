import ExpoModulesCore
import EXUpdatesInterface

let MAX_CACHED_EVENTS = 50

/**
 Encapsulate updates monitoring in this class
 */
@AppMetricsActor
internal class UpdatesMonitoring: MetricReporter {
  private var launchedUpdateId: String?

  // Patch the recorded update ID (if this is an OTA update)
  internal func patchAppInfoIfNeeded() {
    let updateId = getLaunchedUpdateId()
    if updateId != nil {
      logger.info("[AppMetrics] OTA update ID found, patching AppInfo")
      AppMetricsActor.isolated {
        let current = AppInfo.current
        if current.updateId == nil {
          let patched = AppInfo(
            appId: current.appId,
            appName: current.appName,
            appVersion: current.appVersion,
            buildNumber: current.buildNumber,
            updateId: updateId,
          )
          AppInfo.current = patched
          AppMetrics.storage.currentEntry.app = patched
        }
      }
    }
  }

  private func getLaunchedUpdateId() -> String? {
    guard let updatesController = UpdatesControllerRegistry.sharedInstance.controller,
      let launchedUpdateId = updatesController.launchedUpdateId,
      let embeddedUpdateId = updatesController.embeddedUpdateId else {
      return nil
    }

    // Ignore embedded launches – they are not available on the website anyway.
    if launchedUpdateId == embeddedUpdateId {
      return nil
    }
    let uuidString = launchedUpdateId.uuidString.lowercased()
    return uuidString
  }

  nonisolated func downloadTimeMetric(_ subscription: UpdatesStateChangeSubscription?) -> Metric? {
    guard let subscription,
       let context = subscription.getContext() as? UpdatesNativeInterfaceStateContext,
       let updateId = context.downloadedManifest?["id"] as? String,
       let startTime = context.downloadStartTime,
       let finishTime = context.downloadFinishTime else {
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
}
