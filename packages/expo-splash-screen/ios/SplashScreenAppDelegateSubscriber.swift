import ExpoModulesCore

public class SplashScreenAppDelegateSubscriber: ExpoAppDelegateSubscriber, ExpoSceneDelegateSubscriberProtocol {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    SplashScreenPrerender.shared().mountIfPrepared()
    return true
  }

  public func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }
    SplashScreenPrerender.shared().show(in: windowScene)
  }

  public func customizeRootView(_ rootView: UIView) {
    SplashScreenManager.shared.initWith(rootView)
  }
}
