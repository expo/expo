import ExpoModulesCore

public class SplashScreenAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func customizeRootView(_ rootView: UIView) {
    SplashScreenManager.shared.initWith(rootView)
  }
}
