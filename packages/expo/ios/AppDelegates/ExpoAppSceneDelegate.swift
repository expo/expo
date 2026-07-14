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
 */
@available(iOSApplicationExtension, unavailable)
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

    // Under the scene life cycle UIKit passes cold-start URLs and activities in `connectionOptions`
    // rather than in the app delegate's launch options. React Native's `Linking.getInitialURL()`
    // only reads them from launch options, so rebuild them here; otherwise a link that cold-starts
    // the app is delivered to no one, because the `url` event routed below fires before JS is ready.
    let browsingWebActivity = connectionOptions.userActivities.first {
      $0.activityType == NSUserActivityTypeBrowsingWeb
    }
    factory.startReactNative(
      withModuleName: provider.reactNativeFactoryModuleName,
      in: window,
      launchOptions: Self.launchOptions(
        url: connectionOptions.urlContexts.first?.url,
        userActivity: browsingWebActivity
      )
    )

    // Deep links / universal links.
    Self.route(urlContexts: connectionOptions.urlContexts)
    connectionOptions.userActivities.forEach { Self.route(userActivity: $0) }
  }

  open func sceneDidDisconnect(_ scene: UIScene) {
    window = nil
  }

  // In the scene lifecycle UIKit no longer calls the app delegate equivalents, so we forward
  // these to the subscriber manager to preserve existing subscriber behavior.

  open func sceneDidBecomeActive(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationDidBecomeActive(UIApplication.shared)
  }

  open func sceneWillResignActive(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationWillResignActive(UIApplication.shared)
  }

  open func sceneWillEnterForeground(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationWillEnterForeground(UIApplication.shared)
  }

  open func sceneDidEnterBackground(_ scene: UIScene) {
    ExpoAppDelegateSubscriberManager.applicationDidEnterBackground(UIApplication.shared)
  }

  open func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    Self.route(urlContexts: URLContexts)
  }

  open func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    Self.route(userActivity: userActivity)
  }
}

// MARK: - Launch options & routing helpers

extension ExpoAppSceneDelegate {
  /// Rebuilds the launch options that `Linking.getInitialURL()` reads from a scene's connection
  /// options. Returns `nil` when the app wasn't cold-started by a URL or a browsing-web activity,
  /// so it can be forwarded to `startReactNative` as-is.
  static func launchOptions(
    url: URL?,
    userActivity: NSUserActivity?
  ) -> [UIApplication.LaunchOptionsKey: Any]? {
    // Build the keys from their underlying constant strings rather than the `UIApplication`
    // accessors (`.url`, `.userActivityDictionary`): those accessors are deprecated as of iOS 26
    // in favor of the scene APIs, but React Native's `getInitialURL` still reads the launch options
    // by these exact keys, so this is the shape it expects.
    var launchOptions: [UIApplication.LaunchOptionsKey: Any] = [:]
    if let url {
      let urlKey = UIApplication.LaunchOptionsKey(rawValue: "UIApplicationLaunchOptionsURLKey")
      launchOptions[urlKey] = url
    }
    if let userActivity {
      let userActivityDictionaryKey = UIApplication.LaunchOptionsKey(
        rawValue: "UIApplicationLaunchOptionsUserActivityDictionaryKey"
      )
      launchOptions[userActivityDictionaryKey] = [
        "UIApplicationLaunchOptionsUserActivityTypeKey": userActivity.activityType,
        "UIApplicationLaunchOptionsUserActivityKey": userActivity,
      ]
    }
    return launchOptions.isEmpty ? nil : launchOptions
  }

  /// Pass incoming URL contexts to both the subscriber manager and `RCTLinkingManager`.
  public static func route(urlContexts: Set<UIOpenURLContext>) {
    for context in urlContexts {
      let options = openURLOptions(from: context.options)
      _ = ExpoAppDelegateSubscriberManager.application(UIApplication.shared, open: context.url, options: options)
      RCTLinkingManager.application(UIApplication.shared, open: context.url, options: options)
    }
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
}

#endif
