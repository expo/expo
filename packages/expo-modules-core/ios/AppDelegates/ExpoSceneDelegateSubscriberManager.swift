// Copyright 2018-present 650 Industries. All rights reserved.

import Foundation

#if os(iOS) || os(tvOS)

/**
 Forwards `UIWindowSceneDelegate` events to the registered scene delegate subscribers.

 Keep functions and markers in sync with https://developer.apple.com/documentation/uikit/uiwindowscenedelegate
 and https://developer.apple.com/documentation/uikit/uiscenedelegate
 */
@MainActor
@preconcurrency
public class ExpoSceneDelegateSubscriberManager: NSObject {
  // MARK: - Connecting and Disconnecting the Scene

  @objc
  public static func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    ExpoAppDelegateSubscriberRepository.sceneSubscribers.forEach {
      $0.scene?(scene, willConnectTo: session, options: connectionOptions)
    }
  }

  @objc
  public static func sceneDidDisconnect(_ scene: UIScene) {
    ExpoAppDelegateSubscriberRepository.sceneSubscribers.forEach {
      $0.sceneDidDisconnect?(scene)
    }
  }

  // MARK: - Transitioning to the Foreground

  @objc
  public static func sceneWillEnterForeground(_ scene: UIScene) {
    ExpoAppDelegateSubscriberRepository.sceneSubscribers.forEach {
      $0.sceneWillEnterForeground?(scene)
    }
  }

  @objc
  public static func sceneDidBecomeActive(_ scene: UIScene) {
    ExpoAppDelegateSubscriberRepository.sceneSubscribers.forEach {
      $0.sceneDidBecomeActive?(scene)
    }
  }

  // MARK: - Transitioning to the Background

  @objc
  public static func sceneWillResignActive(_ scene: UIScene) {
    ExpoAppDelegateSubscriberRepository.sceneSubscribers.forEach {
      $0.sceneWillResignActive?(scene)
    }
  }

  @objc
  public static func sceneDidEnterBackground(_ scene: UIScene) {
    ExpoAppDelegateSubscriberRepository.sceneSubscribers.forEach {
      $0.sceneDidEnterBackground?(scene)
    }
  }

  // MARK: - Opening URLs

  @objc
  public static func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    ExpoAppDelegateSubscriberRepository.sceneSubscribers.forEach {
      $0.scene?(scene, openURLContexts: URLContexts)
    }
  }

  // MARK: - Continuing User Activities

  @objc
  public static func scene(_ scene: UIScene, willContinueUserActivityWithType userActivityType: String) {
    ExpoAppDelegateSubscriberRepository.sceneSubscribers.forEach {
      $0.scene?(scene, willContinueUserActivityWithType: userActivityType)
    }
  }

  @objc
  public static func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    ExpoAppDelegateSubscriberRepository.sceneSubscribers.forEach {
      $0.scene?(scene, continue: userActivity)
    }
  }

  @objc
  public static func scene(
    _ scene: UIScene,
    didFailToContinueUserActivityWithType userActivityType: String,
    error: Error
  ) {
    ExpoAppDelegateSubscriberRepository.sceneSubscribers.forEach {
      $0.scene?(scene, didFailToContinueUserActivityWithType: userActivityType, error: error)
    }
  }

  @objc
  public static func scene(_ scene: UIScene, didUpdate userActivity: NSUserActivity) {
    ExpoAppDelegateSubscriberRepository.sceneSubscribers.forEach {
      $0.scene?(scene, didUpdate: userActivity)
    }
  }

  // MARK: - Saving the State of Your Scene

  @objc
  public static func stateRestorationActivity(for scene: UIScene) -> NSUserActivity? {
    // There can be only one restoration activity per scene, so use the first one a subscriber provides.
    return ExpoAppDelegateSubscriberRepository.sceneSubscribers
      .lazy
      .compactMap { $0.stateRestorationActivity?(for: scene) }
      .first ?? nil
  }

  // MARK: - Responding to Scene-Based Quick Actions

#if os(iOS)
  @objc
  public static func windowScene(
    _ windowScene: UIWindowScene,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    let parsedSubscribers = ExpoAppDelegateSubscriberRepository.sceneSubscribers.filter {
      $0.responds(to: #selector(UIWindowSceneDelegate.windowScene(_:performActionFor:completionHandler:)))
    }

    if parsedSubscribers.isEmpty {
      completionHandler(false)
      return
    }

    // Each subscriber gets its own completion handler. The aggregated handler reports
    // success if any subscriber handled the action and fires once all of them respond.
    var subscribersLeft = parsedSubscribers.count
    var handled = false
    parsedSubscribers.forEach { subscriber in
      subscriber.windowScene?(windowScene, performActionFor: shortcutItem) { didHandle in
        handled = handled || didHandle
        subscribersLeft -= 1
        if subscribersLeft == 0 {
          completionHandler(handled)
        }
      }
    }
  }

  // MARK: - Responding to Scene Geometry Changes

  @objc
  public static func windowScene(
    _ windowScene: UIWindowScene,
    didUpdate previousCoordinateSpace: UICoordinateSpace,
    interfaceOrientation previousInterfaceOrientation: UIInterfaceOrientation,
    traitCollection previousTraitCollection: UITraitCollection
  ) {
    ExpoAppDelegateSubscriberRepository.sceneSubscribers.forEach {
      $0.windowScene?(
        windowScene,
        didUpdate: previousCoordinateSpace,
        interfaceOrientation: previousInterfaceOrientation,
        traitCollection: previousTraitCollection)
    }
  }
#endif // os(iOS)
}

#endif // os(iOS) || os(tvOS)
