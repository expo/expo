import ExpoModulesCore

public class ExpoLinkingAppLifecycleDelegate: ExpoAppDelegateSubscriber {
  public func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    ExpoLinkingRegistry.shared.initialURL = url
    if let callback = ExpoLinkingRegistry.shared.onURLReceived {
      callback(url)
    }
    return true
  }
}
