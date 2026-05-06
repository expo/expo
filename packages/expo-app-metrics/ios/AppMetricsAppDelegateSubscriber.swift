import ExpoModulesCore

public class AppMetricsAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func appDelegateWillBeginInitialization() {
    AppMetrics.mainSession.appStartupMonitor.markMain()
    AppMetricsActor.isolated {
      NetworkPathMonitor.shared.start()
    }
  }

  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
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
