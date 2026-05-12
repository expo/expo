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
    let updatesInfo = UpdatesMonitoring.getUpdatesMetricsInfo()
    if updatesInfo.updateId != nil || updatesInfo.runtimeVersion != nil {
      logger.info("[AppMetrics] OTA update ID found, patching AppInfo")
      AppMetricsActor.isolated {
        let current = AppInfo.current
        if current.updatesInfo?.updateId == nil {
          let patched = AppInfo(
            appId: current.appId,
            appName: current.appName,
            appVersion: current.appVersion,
            buildNumber: current.buildNumber,
            updatesInfo: updatesInfo
          )
          AppInfo.current = patched
          do {
            try AppMetrics.database?.updateAppUpdatesInfoForActiveSessions(
              updateId: updatesInfo.updateId,
              runtimeVersion: updatesInfo.runtimeVersion,
              requestHeadersJSON: encodeAsJSONString(updatesInfo.requestHeaders)
            )
          } catch {
            logger.warn("[AppMetrics] Failed to patch app updates info on active sessions: \(error.localizedDescription)")
          }
        }
      }
    }
  }

  nonisolated public static func getUpdatesMetricsInfo() -> AppInfo.UpdatesInfo {
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
    let updateId = launchedUpdateId == embeddedUpdateId
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
