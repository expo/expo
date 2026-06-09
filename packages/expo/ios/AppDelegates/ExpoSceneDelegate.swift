import Foundation
import ExpoModulesCore

#if os(iOS) || os(tvOS)
import React


/**
 Allows classes extending `ExpoSceneDelegateSubscriber` to hook into the project's scene delegate
 by forwarding `UIWindowSceneDelegate` events to the subscribers.

 Subclass this in the app's `SceneDelegate` so the app adopts the UIKit scene-based life cycle
 required by the iOS SDK shipped with Xcode 27 and later (Apple Technote TN3187).

 Keep functions and markers in sync with https://developer.apple.com/documentation/uikit/uiwindowscenedelegate
 */
@objc(EXExpoSceneDelegate)
open class ExpoSceneDelegate: UIResponder, UIWindowSceneDelegate {
  open var window: UIWindow?

  // MARK: - Connecting and Disconnecting the Scene

  open func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    if let windowScene = scene as? UIWindowScene {
      startReactNative(in: windowScene)
    }
    ExpoSceneDelegateSubscriberManager.scene(scene, willConnectTo: session, options: connectionOptions)

    // Deliver links that launched the app to React Native, since UIScene routes
    // them here instead of through the app delegate.
    connectionOptions.userActivities.forEach { userActivity in
      RCTLinkingManager.application(.shared, continue: userActivity, restorationHandler: { _ in })
    }
    if !connectionOptions.urlContexts.isEmpty {
      self.scene(scene, openURLContexts: connectionOptions.urlContexts)
    }
  }

  open func sceneDidDisconnect(_ scene: UIScene) {
    ExpoSceneDelegateSubscriberManager.sceneDidDisconnect(scene)
  }

  // MARK: - Transitioning to the Foreground

  open func sceneWillEnterForeground(_ scene: UIScene) {
    ExpoSceneDelegateSubscriberManager.sceneWillEnterForeground(scene)
  }

  open func sceneDidBecomeActive(_ scene: UIScene) {
    ExpoSceneDelegateSubscriberManager.sceneDidBecomeActive(scene)
  }

  // MARK: - Transitioning to the Background

  open func sceneWillResignActive(_ scene: UIScene) {
    ExpoSceneDelegateSubscriberManager.sceneWillResignActive(scene)
  }

  open func sceneDidEnterBackground(_ scene: UIScene) {
    ExpoSceneDelegateSubscriberManager.sceneDidEnterBackground(scene)
  }

  // MARK: - Opening URLs

  open func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    ExpoSceneDelegateSubscriberManager.scene(scene, openURLContexts: URLContexts)

    URLContexts.forEach { urlContext in
      RCTLinkingManager.application(.shared, open: urlContext.url, options: [:])
    }
  }

  // MARK: - Continuing User Activities

  open func scene(_ scene: UIScene, willContinueUserActivityWithType userActivityType: String) {
    ExpoSceneDelegateSubscriberManager.scene(scene, willContinueUserActivityWithType: userActivityType)
  }

  open func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    ExpoSceneDelegateSubscriberManager.scene(scene, continue: userActivity)

    RCTLinkingManager.application(.shared, continue: userActivity, restorationHandler: { _ in })
  }

  open func scene(
    _ scene: UIScene,
    didFailToContinueUserActivityWithType userActivityType: String,
    error: Error
  ) {
    ExpoSceneDelegateSubscriberManager.scene(scene, didFailToContinueUserActivityWithType: userActivityType, error: error)
  }

  open func scene(_ scene: UIScene, didUpdate userActivity: NSUserActivity) {
    ExpoSceneDelegateSubscriberManager.scene(scene, didUpdate: userActivity)
  }

  // MARK: - Saving the State of Your Scene

  open func stateRestorationActivity(for scene: UIScene) -> NSUserActivity? {
    return ExpoSceneDelegateSubscriberManager.stateRestorationActivity(for: scene)
  }

  // MARK: - Responding to Scene-Based Quick Actions

#if os(iOS)
  open func windowScene(
    _ windowScene: UIWindowScene,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    ExpoSceneDelegateSubscriberManager.windowScene(windowScene, performActionFor: shortcutItem, completionHandler: completionHandler)
  }

  // MARK: - Responding to Scene Geometry Changes

  open func windowScene(
    _ windowScene: UIWindowScene,
    didUpdate previousCoordinateSpace: UICoordinateSpace,
    interfaceOrientation previousInterfaceOrientation: UIInterfaceOrientation,
    traitCollection previousTraitCollection: UITraitCollection
  ) {
    ExpoSceneDelegateSubscriberManager.windowScene(
      windowScene,
      didUpdate: previousCoordinateSpace,
      interfaceOrientation: previousInterfaceOrientation,
      traitCollection: previousTraitCollection)
  }
#endif // os(iOS)

  // MARK: - Private

  private func startReactNative(in windowScene: UIWindowScene) {
    guard let appDelegate = UIApplication.shared.delegate as? ExpoAppDelegate,
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
  }
}

#endif // os(iOS) || os(tvOS)
