import Foundation

// swift-format-ignore: AlwaysUseLowerCamelCase
let MAX_CACHED_EVENTS = 50

/// Encapsulate updates monitoring in this class
@AppMetricsActor
internal class UpdatesMonitoring: MetricReporter {
  private var launchedUpdateId: String?

  // Patch the recorded update ID (if this is an OTA update)
  internal func patchAppInfoIfNeeded() {
    let updatesInfo = AppMetrics.host.updatesInfo()
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
            logger.warn(
              "[AppMetrics] Failed to patch app updates info on active sessions: \(error.localizedDescription)"
            )
          }
        }
      }
    }
  }
}
