internal import Expo

/**
 Custom scene delegate that creates the window and installs the custom view controller,
 where React Native and expo-updates initialization is handled.

 Under the scene-based life cycle (required by the iOS 27 SDK) the window is owned by the
 scene, not the app delegate, so the custom init flow is set up here instead of in
 `application(_:didFinishLaunchingWithOptions:)`.
 */
@objc(SceneDelegate)
class SceneDelegate: ExpoAppSceneDelegate {
  override func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window

    // Mirror the window onto the app delegate so code that reads
    // `UIApplication.shared.delegate?.window` keeps working (e.g. expo-system-ui).
    AppDelegate.shared().window = window

    // Create the custom view controller, where the React Native view will be created
    // once expo-updates has started.
    let controller = CustomViewController()
    controller.view.clipsToBounds = true
    window.rootViewController = controller
    window.makeKeyAndVisible()

    // Deep links / universal links.
    Self.route(urlContexts: connectionOptions.urlContexts)
    connectionOptions.userActivities.forEach { Self.route(userActivity: $0) }
  }
}
