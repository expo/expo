// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit
import ExpoModulesCore

@objc(ExpoGoSceneDelegate)
class ExpoGoSceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }

    ExpoKit.sharedInstance().registerRootViewControllerClass(EXRootViewController.self)
    ExpoKit.sharedInstance().prepare()

    let window = UIWindow(windowScene: windowScene)
    window.backgroundColor = .white
    let rootViewController = ExpoKit.sharedInstance().rootViewController() as! EXRootViewController
    window.rootViewController = rootViewController
    self.window = window

    (UIApplication.shared.delegate as? AppDelegate)?.window = window

    if let initialURL = EXKernelLinkingManager.initialUrl(fromLaunchOptions: nil) {
      rootViewController.setInitialHomeURL(initialURL)
    }

    window.makeKeyAndVisible()

    handle(urlContexts: connectionOptions.urlContexts)
    connectionOptions.userActivities.forEach { handle(userActivity: $0) }
  }

  func sceneDidDisconnect(_ scene: UIScene) {
    window = nil
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationDidBecomeActive(UIApplication.shared)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationWillResignActive(UIApplication.shared)
  }

  func sceneWillEnterForeground(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationWillEnterForeground(UIApplication.shared)
  }

  func sceneDidEnterBackground(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationDidEnterBackground(UIApplication.shared)
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    handle(urlContexts: URLContexts)
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    handle(userActivity: userActivity)
  }

  private func handle(urlContexts: Set<UIOpenURLContext>) {
    let linkingManager = EXKernel.sharedInstance().serviceRegistry.linkingManager
    for context in urlContexts {
      _ = linkingManager?.application(UIApplication.shared, open: context.url, options: [:])
    }
  }

  private func handle(userActivity: NSUserActivity) {
    _ = EXKernelLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in }
    )
  }
}
