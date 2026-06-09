internal import Expo
import React
import ReactAppDependencyProvider

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else {
      return
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: appDelegate.launchOptions)

    // Deliver any links that opened the app to React Native, since UIScene
    // routes them here instead of to the app delegate.
    if let userActivity = connectionOptions.userActivities.first {
      RCTLinkingManager.application(
        UIApplication.shared,
        continue: userActivity,
        restorationHandler: { _ in })
    }
    if let urlContext = connectionOptions.urlContexts.first {
      RCTLinkingManager.application(
        UIApplication.shared,
        open: urlContext.url,
        options: [:])
    }
  }

  // Linking API
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let urlContext = URLContexts.first else {
      return
    }
    RCTLinkingManager.application(
      UIApplication.shared,
      open: urlContext.url,
      options: [:])
  }

  // Universal Links
  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in })
  }
}
