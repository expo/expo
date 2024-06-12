import ExpoModulesCore

public class ExpoLinkingAppLifecycleDelegate: ExpoAppDelegateSubscriber {
  public func applicationDidBecomeActive(_ application: UIApplication) {
    // The app has become active.
  }

  public func applicationWillResignActive(_ application: UIApplication) {
    // The app is about to become inactive.
  }

  public func applicationDidEnterBackground(_ application: UIApplication) {
    // The app is now in the background.
  }

  public func applicationWillEnterForeground(_ application: UIApplication) {
    // The app is about to enter the foreground.
  }

  public func applicationWillTerminate(_ application: UIApplication) {
    // The app is about to terminate.
  }
  public func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    ExpoLinkingRegistry.shared.initialURL = url
    if let callback = ExpoLinkingRegistry.shared.onURLReceived {
      callback(url)
    }
    return true
  }
}
