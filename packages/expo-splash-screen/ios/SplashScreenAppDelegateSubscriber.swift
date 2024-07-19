import ExpoModulesCore

public class SplashScreenAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func customiseRootView(rctView: RCTRootView) {
    SplashScreenManager.shared.initWithStoryboard(view: rctView)
  }
}
