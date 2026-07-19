import ExpoModulesCore

public class LinkingAppDelegateSubscriber: ExpoAppDelegateSubscriber {

#if os(iOS) || os(tvOS)
  public func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    ExpoLinkingRegistry.shared.initialURL = url
    NotificationCenter.default.post(name: onURLReceivedNotification, object: self, userInfo: ["url": url])
    return false
  }
#elseif os(macOS)
  public func application(_ application: NSApplication, open urls: [URL]) {
    guard let url = urls.first else {
      return
    }
    ExpoLinkingRegistry.shared.initialURL = url
    NotificationCenter.default.post(name: onURLReceivedNotification, object: self, userInfo: ["url": url])
  }
#endif

  public func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([any UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    // The URL can be nullish when launching App Clips from Test Flight without custom invocations set.
    if userActivity.activityType == NSUserActivityTypeBrowsingWeb, let url = userActivity.webpageURL {
      // App Clips and cold universal link launches don't appear to invoke application:open:options: 
      // so we'll use this first request to assume the initial URL.
      if ExpoLinkingRegistry.shared.initialURL == nil {
        ExpoLinkingRegistry.shared.initialURL = url
      }
      NotificationCenter.default.post(name: onURLReceivedNotification, object: self, userInfo: ["url": url])
      return true
    }
    return false
  }
}
