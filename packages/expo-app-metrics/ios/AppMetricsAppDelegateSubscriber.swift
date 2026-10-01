import ExpoModulesCore

public class AppMetricsAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func appDelegateWillBeginInitialization() {
    AppMetrics.mainSession.appStartupMonitor.markMain()
    // Install the URLSessionTask swizzles synchronously before any app code (RN included) issues
    // its first network request. Doing this on the `AppMetricsActor` would defer it past that
    // point, so it stays inline here. `install()` is idempotent — subsequent app-delegate calls
    // are no-ops.
    NetworkRequestTaskSwizzling.install()
    AppMetricsActor.isolated {
      NetworkPathMonitor.shared.start()
      NetworkRequestMonitor.shared.start()
      // From here on every completed request is recorded as a span, attributed to the main
      // session. Its `sessionStarted` record was enqueued on the actor when `mainSession` was
      // first touched above, so it reaches the sink before any span that references it.
      // The persisted recording policy applies from the first observed request; JS can replace
      // it later via `setNetworkTracesConfig`, affecting subsequent requests only.
      NetworkRequestMonitor.shared.persistence = NetworkRequestPersistence(
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
