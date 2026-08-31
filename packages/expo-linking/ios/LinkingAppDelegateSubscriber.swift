import ExpoModulesCore

public class LinkingAppDelegateSubscriber: ExpoAppDelegateSubscriber {

  #if os(iOS) || os(tvOS)
  public func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:])
    -> Bool
  {
    // The needs-rebuild fingerprint check uses this host as a trigger URL, not a real deep link.
    // Don't store it as the initial URL or notify JS: expo-linking's `getLinkingURL()` /
    // `useLinkingURL()` and its `url` event ignore the trigger. React Native's own Linking
    // module still sees the URL (`ExpoAppSceneDelegate` calls `RCTLinkingManager`
    // unconditionally), so expo-router or other RN-linking-based routers may still receive it.
    if url.host == "expo-fingerprint-check" {
      return false
    }
    ExpoLinkingRegistry.shared.initialURL = url
    NotificationCenter.default.post(name: onURLReceivedNotification, object: self, userInfo: ["url": url])
    return false
  }
  #elseif os(macOS)
  public func application(_ application: NSApplication, open urls: [URL]) {
    guard let url = urls.first else {
      return
    }
    if url.host == "expo-fingerprint-check" {
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
