import EASClient
import ExpoModulesCore

public class AppMetricsAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func appDelegateWillBeginInitialization() {
    // Before the main session starts: its session row reads the update info.
    let clientId = EASClientID.uuid()
    AppMetrics.configure(
      AppMetricsHost(
        updatesInfo: expoUpdatesInfo,
        bundleLoadTime: reactBundleLoadTime,
        clientId: clientId.uuidString,
        clientSampleValue: EASClientID.deterministicUniformValue(clientId),
        isDebugBuild: EXAppDefines.APP_DEBUG
      )
    )
    AppMetrics.mainSession.appStartupMonitor.markMain()
    // Install the URLSessionTask swizzles synchronously before any app code (RN included) issues
    // its first network request. Doing this on the `AppMetricsActor` would defer it past that
    // point, so it stays inline here. `install()` is idempotent — subsequent app-delegate calls
    // are no-ops.
    NetworkRequestTaskSwizzling.install()
    AppMetricsActor.isolated {
      NetworkPathMonitor.shared.start()
      NetworkRequestMonitor.shared.start()
      // From here on every completed request is written to the database, attributed to the main
      // session. The session's row INSERT was enqueued on the actor when `mainSession` was first
      // touched above, so it lands before any request row that references it.
      // The persisted recording policy applies from the first observed request; JS can replace
      // it later via `setNetworkTracesConfig`, affecting subsequent requests only.
      NetworkRequestMonitor.shared.persistence = NetworkRequestPersistence(
        writer: AppMetrics.spanWriter,
        configuration: AppMetricsUserDefaults.networkTracesConfiguration ?? NetworkTracesConfiguration()
      ) {
        return AppMetrics.mainSession.id
      }
    }
  }

  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    AppMetrics.mainSession.appStartupMonitor.markDidFinishLaunching()
    return true
  }

  public func applicationDidBecomeActive(_ application: UIApplication) {
    AppMetrics.startNewForegroundSession()
  }

  public func applicationDidEnterBackground(_ application: UIApplication) {
    AppMetricsActor.isolated {
      let monitor = AppMetrics.mainSession.appStartupMonitor
      if monitor.startupState == .launching {
        monitor.startupState = .interrupted
      }
    }
    AppMetrics.stopForegroundSession()
  }

  public func applicationDidReceiveMemoryWarning(_ application: UIApplication) {
    AppMetricsActor.isolated {
      AppMetrics.mainSession.memoryMeter.receivedMemoryWarning()
    }
  }

  public func applicationWillTerminate(_ application: UIApplication) {
    AppMetricsActor.isolated {
      AppMetrics.mainSession.stop()
    }
  }
}

/// Duration of JS bundle evaluation, which also covers synchronous setup of the native modules
/// eagerly required during that evaluation. React Native logs `APP_STARTUP_STOP` right after
/// evaluation finishes, so it stands in for the bundle end time.
private func reactBundleLoadTime() -> TimeInterval? {
  let bundleStartTime = ReactMarker.getRunJSBundleStartTime()
  let bundleEndTime = ReactMarker.getAppStartupEndTime()
  // The markers are `NaN` until React Native logs them (e.g. no logger attached), and any
  // arithmetic on `NaN` stays `NaN`. Skip the metric rather than report a bogus value.
  guard bundleStartTime.isFinite, bundleEndTime.isFinite else {
    return nil
  }
  return (bundleEndTime - bundleStartTime) / 1000
}
