// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore
import React

#if os(iOS) || os(tvOS)

/**
`UIWindowSceneDelegate` base class for Expo apps. Required by the iOS 27, which
 asserts at launch unless the app adopts the scene-based life cycle.

 Responsibilities:
 - Create the `UIWindow` from the connecting `UIWindowScene` and start React Native into it.
 - Re-feed scene life-cycle, URL, and user-activity events to the existing
   `ExpoAppDelegateSubscriberManager`, so app delegate subscribers keep working unchanged.
 - Forward the same events to `ExpoSceneDelegateSubscriberManager` so modules can subscribe
   to the scene life cycle directly (with the real `UIScene`).
 */
@objc(EXExpoAppSceneDelegate)
open class ExpoAppSceneDelegate: UIResponder, UIWindowSceneDelegate {
  open var window: UIWindow?

  open func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }
    guard let provider = UIApplication.shared.delegate as? ExpoReactNativeFactoryProvider,
      let factory = provider.reactNativeFactory else {
      fatalError(
        "ExpoAppSceneDelegate couldn't start React Native because the app delegate doesn't provide a "
        + "React Native factory. Make sure your AppDelegate conforms to ExpoReactNativeFactoryProvider and "
        + "creates its RCTReactNativeFactory in application(_:didFinishLaunchingWithOptions:)."
      )
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window

    // Mirror the window onto the app delegate so code that reads
    // `UIApplication.shared.delegate?.window` keeps working (e.g. expo-system-ui).
    provider.window = window

    // launchOptions is nil under the scene life cycle; cold-start URLs/activities arrive via
    // `connectionOptions` and are routed below.
    factory.startReactNative(
      withModuleName: provider.reactNativeFactoryModuleName,
      in: window,
      launchOptions: nil
    )

    ExpoSceneDelegateSubscriberManager.scene(scene, willConnectTo: session, options: connectionOptions)

    // Deep links / universal links.
    Self.route(urlContexts: connectionOptions.urlContexts)
    connectionOptions.userActivities.forEach { Self.route(userActivity: $0) }
  }

  open func sceneDidDisconnect(_ scene: UIScene) {
    window = nil
    ExpoSceneDelegateSubscriberManager.sceneDidDisconnect(scene)
  }

  // In the scene lifecycle UIKit no longer calls the app delegate equivalents, so we forward
  // these to the subscriber manager to preserve existing subscriber behavior, and to the
  // scene subscriber manager so modules can react to the scene directly.

  open func sceneDidBecomeActive(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationDidBecomeActive(UIApplication.shared)
    ExpoSceneDelegateSubscriberManager.sceneDidBecomeActive(scene)
  }

  open func sceneWillResignActive(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationWillResignActive(UIApplication.shared)
    ExpoSceneDelegateSubscriberManager.sceneWillResignActive(scene)
  }

  open func sceneWillEnterForeground(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationWillEnterForeground(UIApplication.shared)
    ExpoSceneDelegateSubscriberManager.sceneWillEnterForeground(scene)
  }

  open func sceneDidEnterBackground(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationDidEnterBackground(UIApplication.shared)
    ExpoSceneDelegateSubscriberManager.sceneDidEnterBackground(scene)
  }

  open func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    ExpoSceneDelegateSubscriberManager.scene(scene, openURLContexts: URLContexts)
    Self.route(urlContexts: URLContexts)
  }

  open func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    ExpoSceneDelegateSubscriberManager.scene(scene, continue: userActivity)
    Self.route(userActivity: userActivity)
  }

  open func scene(_ scene: UIScene, willContinueUserActivityWithType userActivityType: String) {
    ExpoSceneDelegateSubscriberManager.scene(scene, willContinueUserActivityWithType: userActivityType)
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

  open func stateRestorationActivity(for scene: UIScene) -> NSUserActivity? {
    return ExpoSceneDelegateSubscriberManager.stateRestorationActivity(for: scene)
  }

#if os(iOS)
  open func windowScene(
    _ windowScene: UIWindowScene,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    ExpoSceneDelegateSubscriberManager.windowScene(windowScene, performActionFor: shortcutItem, completionHandler: completionHandler)
  }

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

  /// Pass incoming URL contexts to both the subscriber manager and `RCTLinkingManager`.
  public static func route(urlContexts: Set<UIOpenURLContext>) {
    for context in urlContexts {
      let options = openURLOptions(from: context.options)
      _ = ExpoAppDelegateSubscriberManager.application(UIApplication.shared, open: context.url, options: options)
      RCTLinkingManager.application(UIApplication.shared, open: context.url, options: options)
    }
  }

  private static func openURLOptions(
    from sceneOptions: UIScene.OpenURLOptions
  ) -> [UIApplication.OpenURLOptionsKey: Any] {
    var options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    if let sourceApplication = sceneOptions.sourceApplication {
      options[.sourceApplication] = sourceApplication
    }
    if let annotation = sceneOptions.annotation {
      options[.annotation] = annotation
    }
    options[.openInPlace] = sceneOptions.openInPlace
    return options
  }

  /// Passes an incoming `NSUserActivity` to both the subscriber manager and `RCTLinkingManager`.
  public static func route(userActivity: NSUserActivity) {
    _ = ExpoAppDelegateSubscriberManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
    RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }
}

#endif
