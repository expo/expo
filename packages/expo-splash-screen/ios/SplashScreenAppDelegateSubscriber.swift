import ExpoModulesCore

public class SplashScreenAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    SplashScreenPrerender.shared().mountIfPrepared()
    return true
  }

  public func windowSceneWillConnect(_ windowScene: UIWindowScene) {
    SplashScreenPrerender.shared().show(in: windowScene)
  }

  public func customizeRootView(_ rootView: UIView) {
    SplashScreenManager.shared.initWith(rootView)
  }
}
