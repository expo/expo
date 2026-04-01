import ExpoModulesCore

internal let logger = Logger(logHandlers: [createOSLogHandler(category: Logger.EXPO_LOG_CATEGORY)])

public final class AppMetricsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAppMetrics")

    OnCreate {
      AppMetricsActor.isolated {
        AppMetrics.mainSession.startMonitoringFrames()

        let current = AppInfo.current
        if current.updateId == nil, let updateId = AppInfo.getLaunchedUpdateId() {
          let patched = AppInfo(
            appId: current.appId,
            appName: current.appName,
            appVersion: current.appVersion,
            buildNumber: current.buildNumber,
            updateId: updateId,
            easBuildId: current.easBuildId,
          )
          AppInfo.current = patched
          AppMetrics.storage.currentEntry.app = patched
        }
      }
    }

    OnDestroy {
      AppMetricsActor.isolated {
        AppMetrics.mainSession.stopMonitoringFrames()
      }
    }

    Function("markFirstRender") {
      AppMetrics.mainSession.appStartupMonitor.markFirstRender()
    }

    Function("markInteractive") { (routeName: String?) in
      AppMetrics.mainSession.appStartupMonitor.markInteractive(routeName: routeName)
    }

    AsyncFunction("getAppStartupTimesAsync") {
      return await AppMetrics.mainSession.appStartupMonitor.metrics
    }

    AsyncFunction("getMemoryUsageSnapshotAsync") {
      return try await AppMetricsActor.isolated {
        return MemoryUsageSnapshot.getCurrent()
      }
    }

    AsyncFunction("getFrameRateMetricsAsync") {
      return await AppMetrics.mainSession.framesMeter.metrics
    }

    AsyncFunction("getStoredEntries") {
      return await AppMetrics.storage.getAllEntries()
    }

    AsyncFunction("clearStoredEntries") {
      return try await AppMetrics.storage.clear()
    }

  }
}
