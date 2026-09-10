// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import React
#if canImport(ExpoObjC)
import ExpoObjC
#endif

#if os(iOS) || os(tvOS)

/**
`UIWindowSceneDelegate` base class for Expo apps. Required by the iOS 27, which
 asserts at launch unless the app adopts the scene-based life cycle.

 Responsibilities:
 - Create the `UIWindow` from the connecting `UIWindowScene` and start React Native into it.
 - Re-feed scene life-cycle, URL, user-activity, and quick-action events to the app delegate.

 Requires the app delegate to be an `ExpoAppDelegate`; it forwards every event to the subscribers,
 so one call reaches both subscribers and `AppDelegate` overrides.
 */
@available(iOSApplicationExtension, unavailable)
@objc(EXExpoAppSceneDelegate)
open class ExpoAppSceneDelegate: UIResponder, UIWindowSceneDelegate {
  open var window: UIWindow?

  let forwarder = SceneEventForwarder()

  open func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }
    guard let appDelegate = UIApplication.shared.delegate as? ExpoAppDelegate,
      let provider = appDelegate as? ExpoReactNativeFactoryProvider,
      let factory = provider.reactNativeFactory else {
      fatalError(
        "ExpoAppSceneDelegate couldn't start React Native because the app delegate isn't an "
        + "ExpoAppDelegate that provides a React Native factory. Make sure your AppDelegate subclasses "
        + "ExpoAppDelegate, conforms to ExpoReactNativeFactoryProvider and creates its "
        + "RCTReactNativeFactory in application(_:didFinishLaunchingWithOptions:)."
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
    connectionOptions.urlContexts.forEach {
      forwarder.open(url: $0.url, options: Self.openURLOptions(from: $0.options))
    }
    connectionOptions.userActivities.forEach { forwarder.continue($0) }

#if os(iOS)
    // A quick action that cold-starts the app arrives here instead of in
    // `windowScene(_:performActionFor:completionHandler:)`, which UIKit only calls while running.
    if let shortcutItem = connectionOptions.shortcutItem {
      forwarder.perform(shortcutItem) { _ in }
    }
#endif
  }

  open func sceneDidDisconnect(_ scene: UIScene) {
    window = nil
  }

  open func sceneDidBecomeActive(_ scene: UIScene) {
    forwarder.didBecomeActive()
  }

  open func sceneWillResignActive(_ scene: UIScene) {
    forwarder.willResignActive()
  }

  open func sceneWillEnterForeground(_ scene: UIScene) {
    forwarder.willEnterForeground()
  }

  open func sceneDidEnterBackground(_ scene: UIScene) {
    forwarder.didEnterBackground()
  }

  open func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    URLContexts.forEach { forwarder.open(url: $0.url, options: Self.openURLOptions(from: $0.options)) }
  }

  open func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    forwarder.continue(userActivity)
  }

#if os(iOS)
  open func windowScene(
    _ windowScene: UIWindowScene,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    forwarder.perform(shortcutItem, completionHandler: completionHandler)
  }
#endif
}

// MARK: - Launch options

@available(iOSApplicationExtension, unavailable)
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
