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
 - Re-feed scene life-cycle, URL, user-activity, and quick-action events to the app delegate, so
   both app delegate subscribers and `AppDelegate` overrides keep working unchanged.
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

#if os(iOS)
    // A quick action that cold-starts the app arrives here instead of in
    // `windowScene(_:performActionFor:completionHandler:)`, which UIKit only calls while running.
    if let shortcutItem = connectionOptions.shortcutItem {
      Self.route(shortcutItem: shortcutItem, completionHandler: { _ in })
    }
#endif
  }

  open func sceneDidDisconnect(_ scene: UIScene) {
    window = nil
  }

  open func sceneDidBecomeActive(_ scene: UIScene) {
    Self.route(lifeCycleEvent: .didBecomeActive)
  }

  open func sceneWillResignActive(_ scene: UIScene) {
    Self.route(lifeCycleEvent: .willResignActive)
  }

  open func sceneWillEnterForeground(_ scene: UIScene) {
    Self.route(lifeCycleEvent: .willEnterForeground)
  }

  open func sceneDidEnterBackground(_ scene: UIScene) {
    Self.route(lifeCycleEvent: .didEnterBackground)
  }

  open func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    Self.route(urlContexts: URLContexts)
  }

  open func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    Self.route(userActivity: userActivity)
  }

#if os(iOS)
  open func windowScene(
    _ windowScene: UIWindowScene,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    Self.route(shortcutItem: shortcutItem, completionHandler: completionHandler)
  }
#endif
}

// MARK: - Launch options & routing helpers

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

  /// Scene life-cycle events that have a `UIApplicationDelegate` counterpart.
  enum LifeCycleEvent {
    case didBecomeActive
    case willResignActive
    case willEnterForeground
    case didEnterBackground
  }

  /// Passes incoming URL contexts to the app delegate and `RCTLinkingManager`.
  public static func route(
    urlContexts: Set<UIOpenURLContext>,
    to delegate: UIApplicationDelegate? = UIApplication.shared.delegate
  ) {
    for context in urlContexts {
      route(url: context.url, options: openURLOptions(from: context.options), to: delegate)
    }
  }

  /// Passes an incoming URL to the app delegate and `RCTLinkingManager`.
  static func route(
    url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any],
    to delegate: UIApplicationDelegate? = UIApplication.shared.delegate
  ) {
    let application = UIApplication.shared
    notifyLinkingManagerUnlessAlreadyNotified(of: url) {
      route(
        selector: #selector(UIApplicationDelegate.application(_:open:options:)),
        to: delegate,
        toDelegate: { _ = $0.application?(application, open: url, options: options) },
        toSubscribers: { _ = ExpoAppDelegateSubscriberManager.application(application, open: url, options: options) }
      )
    } notify: {
      RCTLinkingManager.application(application, open: url, options: options)
    }
  }

  /// Passes an incoming `NSUserActivity` to the app delegate and `RCTLinkingManager`.
  public static func route(
    userActivity: NSUserActivity,
    to delegate: UIApplicationDelegate? = UIApplication.shared.delegate
  ) {
    let application = UIApplication.shared
    // `RCTLinkingManager` only announces browsing-web activities, so there is nothing to dedupe
    // against for the other activity types.
    notifyLinkingManagerUnlessAlreadyNotified(of: userActivity.webpageURL) {
      route(
        selector: #selector(UIApplicationDelegate.application(_:continue:restorationHandler:)),
        to: delegate,
        toDelegate: { _ = $0.application?(application, continue: userActivity, restorationHandler: { _ in }) },
        toSubscribers: {
          _ = ExpoAppDelegateSubscriberManager.application(
            application,
            continue: userActivity,
            restorationHandler: { _ in }
          )
        }
      )
    } notify: {
      RCTLinkingManager.application(application, continue: userActivity, restorationHandler: { _ in })
    }
  }

  /// Passes a scene life-cycle event to its app delegate counterpart.
  static func route(
    lifeCycleEvent event: LifeCycleEvent,
    to delegate: UIApplicationDelegate? = UIApplication.shared.delegate
  ) {
    let application = UIApplication.shared
    switch event {
    case .didBecomeActive:
      route(
        selector: #selector(UIApplicationDelegate.applicationDidBecomeActive(_:)),
        to: delegate,
        toDelegate: { $0.applicationDidBecomeActive?(application) },
        toSubscribers: { ExpoAppDelegateSubscriberManager.applicationDidBecomeActive(application) }
      )
    case .willResignActive:
      route(
        selector: #selector(UIApplicationDelegate.applicationWillResignActive(_:)),
        to: delegate,
        toDelegate: { $0.applicationWillResignActive?(application) },
        toSubscribers: { ExpoAppDelegateSubscriberManager.applicationWillResignActive(application) }
      )
    case .willEnterForeground:
      route(
        selector: #selector(UIApplicationDelegate.applicationWillEnterForeground(_:)),
        to: delegate,
        toDelegate: { $0.applicationWillEnterForeground?(application) },
        toSubscribers: { ExpoAppDelegateSubscriberManager.applicationWillEnterForeground(application) }
      )
    case .didEnterBackground:
      route(
        selector: #selector(UIApplicationDelegate.applicationDidEnterBackground(_:)),
        to: delegate,
        toDelegate: { $0.applicationDidEnterBackground?(application) },
        toSubscribers: { ExpoAppDelegateSubscriberManager.applicationDidEnterBackground(application) }
      )
    }
  }

#if os(iOS)
  /// Passes a quick action to the app delegate.
  ///
  /// The `completionHandler` reports back to UIKit whether the action was handled, so it must run
  /// exactly once: whoever implements the method owns it, and this never delivers to both the
  /// delegate and the subscriber manager.
  static func route(
    shortcutItem: UIApplicationShortcutItem,
    to delegate: UIApplicationDelegate? = UIApplication.shared.delegate,
    completionHandler: @escaping (Bool) -> Void
  ) {
    let application = UIApplication.shared
    let selector = #selector(UIApplicationDelegate.application(_:performActionFor:completionHandler:))

    guard let delegate, delegate.responds(to: selector) else {
      ExpoAppDelegateSubscriberManager.application(
        application,
        performActionFor: shortcutItem,
        completionHandler: completionHandler
      )
      return
    }
    delegate.application?(application, performActionFor: shortcutItem, completionHandler: completionHandler)
  }
#endif

  /// Sends an event to the app delegate, and to the subscriber manager unless the delegate
  /// forwards there on its own.
  ///
  /// UIKit stops calling the app delegate's own life-cycle, URL and quick-action methods once the
  /// app adopts the scene life cycle, so overrides in the app's `AppDelegate` would never run.
  /// An `ExpoAppDelegate` forwards every event it receives to the subscriber manager, so the
  /// delegate call is the only delivery needed — an override that skips `super` drops the
  /// subscribers, exactly as it does under the app-delegate life cycle. A brownfield delegate
  /// forwards nothing, so there the subscribers are notified from here.
  private static func route(
    selector: Selector,
    to delegate: UIApplicationDelegate?,
    toDelegate: (UIApplicationDelegate) -> Void,
    toSubscribers: () -> Void
  ) {
    guard let delegate, delegate.responds(to: selector) else {
      toSubscribers()
      return
    }
    toDelegate(delegate)

    if !(delegate is ExpoAppDelegate) {
      toSubscribers()
    }
  }

  /// Runs `body`, then calls `notify` unless `RCTLinkingManager` was already notified about `url`
  /// while `body` ran. Always calls `notify` when `url` is `nil`.
  ///
  /// App delegates generated by SDK 57 and older call `RCTLinkingManager` from their own
  /// `application(_:open:options:)` and `application(_:continue:restorationHandler:)` overrides,
  /// which would deliver the JS `url` event twice now that those overrides run again. There is no
  /// way to detect such an override statically, so this listens for the notification
  /// `RCTLinkingManager` posts synchronously for every link it handles. The notification name is
  /// private to React Native's `RCTLinkingManager.mm`: if React Native ever renames it, those
  /// legacy overrides deliver a duplicate `url` event again — a link is never lost.
  private static func notifyLinkingManagerUnlessAlreadyNotified(
    of url: URL?,
    during body: () -> Void,
    notify: () -> Void
  ) {
    guard let url else {
      body()
      notify()
      return
    }
    let observer = LinkingManagerObserver(url: url)
    body()
    if !observer.wasNotified {
      notify()
    }
  }

  private final class LinkingManagerObserver: NSObject {
    private let expectedURL: String
    private(set) var wasNotified = false

    init(url: URL) {
      expectedURL = url.absoluteString
      super.init()
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(linkingManagerDidOpenURL(_:)),
        name: Notification.Name("RCTOpenURLNotification"),
        object: nil
      )
    }

    deinit {
      NotificationCenter.default.removeObserver(self)
    }

    @objc
    private func linkingManagerDidOpenURL(_ notification: Notification) {
      wasNotified = wasNotified || notification.userInfo?["url"] as? String == expectedURL
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
}

#endif
