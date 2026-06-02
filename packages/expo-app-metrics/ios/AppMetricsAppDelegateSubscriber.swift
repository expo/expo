import ExpoModulesCore

public class AppMetricsAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func appDelegateWillBeginInitialization() {
    AppMetrics.mainSession.appStartupMonitor.markMain()
    // Register the protocol class and install the swizzle synchronously, before any app code (RN
    // included) issues its first network request — both `URLProtocol.registerClass` and the
    // swizzle must already be in place or early requests slip through unobserved. Doing this on the
    // `AppMetricsActor` would defer it past that point, so it stays inline here. `register()` is
    // idempotent, so the later `NetworkRequestMonitor.start()` simply confirms it.
    //
    // The configuration swizzle is on by default — set `EX_APP_METRICS_NO_INTERCEPT_URLSESSION=1`
    // in the podspec env to disable. Without it, any session built from a fresh
    // `URLSessionConfiguration.default`/`.ephemeral` (including React Native's networking) is
    // invisible; `URLProtocol.registerClass` still catches `URLSession.shared` traffic regardless.
    NetworkRequestURLProtocol.register()
    #if !EX_APP_METRICS_NO_INTERCEPT_URLSESSION
    NetworkRequestConfigurationSwizzling.install(protocolClass: NetworkRequestURLProtocol.self)
    #endif
    AppMetricsActor.isolated {
      NetworkPathMonitor.shared.start()
      NetworkRequestMonitor.shared.start()
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
