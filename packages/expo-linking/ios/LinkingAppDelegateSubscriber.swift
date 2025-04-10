import ExpoModulesCore

public class LinkingAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  private static let isAppClip: Bool = {
    // Having an NSAppClip key is not technically required but it's how App Clips are generated and
    // there was no other clear indicator without knowing the child bundle identifier ahead of time.
    if let infoPlist = Bundle.main.infoDictionary, infoPlist["NSAppClip"] != nil {
      return true
    }
    return false
  }()

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
      // App Clips don't appear to invoke application:open:options: so we'll use this first request to assume the initial URL.
      if ExpoLinkingRegistry.shared.initialURL == nil && LinkingAppDelegateSubscriber.isAppClip {
        ExpoLinkingRegistry.shared.initialURL = url
      }
      NotificationCenter.default.post(name: onURLReceivedNotification, object: self, userInfo: ["url": url])
      return true
    }
    return false
  }
}
