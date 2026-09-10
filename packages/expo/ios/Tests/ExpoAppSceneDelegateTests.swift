// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import React
import Testing
@testable import Expo

#if os(iOS) || os(tvOS)

@Suite
struct ExpoAppSceneDelegateTests {
  @Test
  func `extends UIResponder`() {
    // Assert that `ExpoAppSceneDelegate` extends from `UIResponder` so it doesn't regress in the future.
    // UIKit instantiates the scene delegate by name and expects a responder; losing this would break
    // responder-chain behavior such as key presses.
    #expect(ExpoAppSceneDelegate.self is UIResponder.Type)
  }

  @Test
  func `conforms to UIWindowSceneDelegate`() {
    // The iOS 27 SDK asserts at launch unless the app's scene delegate adopts the scene life cycle.
    // Conforming to `UIWindowSceneDelegate` is what makes the class usable as the scene delegate.
    #expect(ExpoAppSceneDelegate.self is UIWindowSceneDelegate.Type)
  }

  @Test
  @MainActor
  func `builds launch options carrying a cold-start URL`() {
    // Under the scene life cycle the URL that cold-started the app arrives in the scene connection
    // options, not in the app delegate's launch options. Synthesizing launch options from it is
    // what lets `Linking.getInitialURL()` (which reads `UIApplicationLaunchOptionsURLKey`) return
    // the URL, matching the app-delegate life cycle it replaced.
    let url = URL(string: "bareexpo://test-suite/run?tests=AppMetrics")!
    let launchOptions = ExpoAppSceneDelegate.launchOptions(url: url, userActivity: nil)
    let urlKey = UIApplication.LaunchOptionsKey(rawValue: "UIApplicationLaunchOptionsURLKey")
    #expect(launchOptions?[urlKey] as? URL == url)
  }

  @Test
  @MainActor
  func `builds launch options carrying a browsing-web user activity`() {
    let userActivity = NSUserActivity(activityType: NSUserActivityTypeBrowsingWeb)
    userActivity.webpageURL = URL(string: "https://expo.dev/link")!
    let launchOptions = ExpoAppSceneDelegate.launchOptions(url: nil, userActivity: userActivity)
    let userActivityDictionaryKey = UIApplication.LaunchOptionsKey(
      rawValue: "UIApplicationLaunchOptionsUserActivityDictionaryKey"
    )
    let activityDictionary = launchOptions?[userActivityDictionaryKey] as? [AnyHashable: Any]
    #expect(activityDictionary?["UIApplicationLaunchOptionsUserActivityTypeKey"] as? String == NSUserActivityTypeBrowsingWeb)
    #expect((activityDictionary?["UIApplicationLaunchOptionsUserActivityKey"] as? NSUserActivity) === userActivity)
  }

  @Test
  @MainActor
  func `returns nil launch options without a URL or user activity`() {
    #expect(ExpoAppSceneDelegate.launchOptions(url: nil, userActivity: nil) == nil)
  }

  @Test
  @MainActor
  func `routes an opened URL through the app delegate`() {
    let spy = SpyAppDelegate()
    let url = URL(string: "bareexpo://scene-delegate/open-url")!
    ExpoAppSceneDelegate.route(url: url, options: [.sourceApplication: "dev.expo.Payments"], to: spy)
    #expect(spy.openedURLs.count == 1)
    #expect(spy.openedURLs.first?.url == url)
    #expect(spy.openedURLs.first?.options[.sourceApplication] as? String == "dev.expo.Payments")
  }

  @Test
  @MainActor
  func `routes a continued user activity through the app delegate`() {
    let spy = SpyAppDelegate()
    let userActivity = NSUserActivity(activityType: NSUserActivityTypeBrowsingWeb)
    userActivity.webpageURL = URL(string: "https://expo.dev/scene-delegate")!
    ExpoAppSceneDelegate.route(userActivity: userActivity, to: spy)
    #expect(spy.continuedUserActivities.count == 1)
    #expect(spy.continuedUserActivities.first === userActivity)
  }

  @Test
  @MainActor
  func `routes life cycle events through the app delegate`() {
    let spy = SpyAppDelegate()
    ExpoAppSceneDelegate.route(lifeCycleEvent: .didBecomeActive, to: spy)
    ExpoAppSceneDelegate.route(lifeCycleEvent: .willResignActive, to: spy)
    ExpoAppSceneDelegate.route(lifeCycleEvent: .willEnterForeground, to: spy)
    ExpoAppSceneDelegate.route(lifeCycleEvent: .didEnterBackground, to: spy)
    #expect(spy.lifeCycleEvents == [
      "applicationDidBecomeActive",
      "applicationWillResignActive",
      "applicationWillEnterForeground",
      "applicationDidEnterBackground"
    ])
  }

#if os(iOS)
  @Test
  @MainActor
  func `routes a quick action through the app delegate`() async {
    let spy = SpyAppDelegate()
    let shortcutItem = UIApplicationShortcutItem(
      type: "dev.expo.bareexpo.run-tests",
      localizedTitle: "Run tests"
    )
    var handled: [Bool] = []
    // The subscriber manager completes on the next main-queue turn when a subscriber handles the
    // action, so wait for the first reply instead of assuming a synchronous one.
    await withCheckedContinuation { continuation in
      var didResume = false
      ExpoAppSceneDelegate.route(shortcutItem: shortcutItem, to: spy) { succeeded in
        handled.append(succeeded)
        if !didResume {
          didResume = true
          continuation.resume()
        }
      }
    }
    await drainMainQueue()
    #expect(spy.shortcutItemTypes == [shortcutItem.type])
    #expect(handled == [false])
  }
#endif

  @Test
  @MainActor
  func `notifies RCTLinkingManager once per routed URL`() {
    let url = URL(string: "bareexpo://scene-delegate/linking")!
    let recorder = OpenURLNotificationRecorder()
    ExpoAppSceneDelegate.route(url: url, options: [:], to: SpyAppDelegate())
    #expect(recorder.count(of: url) == 1)
  }

  @Test
  @MainActor
  func `notifies RCTLinkingManager once when the delegate notifies it too`() {
    let delegate = LegacyLinkingAppDelegate()
    let url = URL(string: "bareexpo://scene-delegate/legacy-open-url")!
    let recorder = OpenURLNotificationRecorder()
    ExpoAppSceneDelegate.route(url: url, options: [:], to: delegate)
    #expect(delegate.openedURLs == [url])
    #expect(recorder.count(of: url) == 1)
  }

  @Test
  @MainActor
  func `notifies RCTLinkingManager once per user activity when the delegate notifies it too`() {
    let delegate = LegacyLinkingAppDelegate()
    let webpageURL = URL(string: "https://expo.dev/scene-delegate/legacy-activity")!
    let userActivity = NSUserActivity(activityType: NSUserActivityTypeBrowsingWeb)
    userActivity.webpageURL = webpageURL
    let recorder = OpenURLNotificationRecorder()
    ExpoAppSceneDelegate.route(userActivity: userActivity, to: delegate)
    #expect(delegate.continuedUserActivities.count == 1)
    #expect(recorder.count(of: webpageURL) == 1)
  }

  @Test
  @MainActor
  func `does not notify subscribers without an ExpoAppDelegate`() {
    let subscriber = URLRecordingSubscriber()
    ExpoAppDelegateSubscriberRepository.registerSubscriber(subscriber)

    let url = URL(string: "bareexpo://scene-delegate/no-app-delegate")!
    let recorder = OpenURLNotificationRecorder()
    ExpoAppSceneDelegate.route(url: url, options: [:], to: nil)
    #expect(subscriber.count(of: url) == 0)
    #expect(recorder.count(of: url) == 1)
  }

#if os(iOS)
  @Test
  @MainActor
  func `completes a quick action with false without an ExpoAppDelegate`() async {
    let shortcutItem = UIApplicationShortcutItem(
      type: "dev.expo.bareexpo.unhandled-action",
      localizedTitle: "Unhandled action"
    )
    var handled: [Bool] = []
    await withCheckedContinuation { continuation in
      var didResume = false
      ExpoAppSceneDelegate.route(shortcutItem: shortcutItem, to: nil) { succeeded in
        handled.append(succeeded)
        if !didResume {
          didResume = true
          continuation.resume()
        }
      }
    }
    await drainMainQueue()
    #expect(handled == [false])
  }
#endif

  @Test
  @MainActor
  func `routes through the public functions passed as function values`() {
    let userActivity = NSUserActivity(activityType: NSUserActivityTypeBrowsingWeb)
    userActivity.webpageURL = URL(string: "https://expo.dev/scene-delegate/function-value")!
    [userActivity].forEach(ExpoAppSceneDelegate.route(userActivity:))
    [Set<UIOpenURLContext>()].forEach(ExpoAppSceneDelegate.route(urlContexts:))
  }
}

/// App delegate shaped like the SDK ≤ 57 templates, which call `RCTLinkingManager` from their own
/// overrides. See `packages/expo-updates/e2e/fixtures/custom_init/AppDelegate.swift`.
private final class LegacyLinkingAppDelegate: ExpoAppDelegate {
  var openedURLs: [URL] = []
  var continuedUserActivities: [NSUserActivity] = []

  override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any]
  ) -> Bool {
    openedURLs.append(url)
    let handled = super.application(app, open: url, options: options)
    RCTLinkingManager.application(app, open: url, options: options)
    return handled
  }

  override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    continuedUserActivities.append(userActivity)
    let handled = super.application(application, continue: userActivity, restorationHandler: restorationHandler)
    RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return handled
  }
}

/// Lets the main-queue blocks scheduled so far run, so a late duplicate reply is recorded before
/// the assertions.
@MainActor
private func drainMainQueue() async {
  await withCheckedContinuation { continuation in
    DispatchQueue.main.async { continuation.resume() }
  }
}

/// Records the URLs a module subscriber receives. Registration is permanent for the process, so it
/// reports not having handled the URL to leave the other delegates' behavior untouched.
private final class URLRecordingSubscriber: NSObject, ExpoAppDelegateSubscriberProtocol {
  private var urls: [URL] = []

  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    urls.append(url)
    return false
  }

  func count(of url: URL) -> Int {
    return urls.filter { $0 == url }.count
  }
}

/// Records the events an `ExpoAppDelegate` subclass receives, then forwards them to `super` the way
/// an app's own `AppDelegate` override would.
private final class SpyAppDelegate: ExpoAppDelegate {
  struct OpenedURL {
    let url: URL
    let options: [UIApplication.OpenURLOptionsKey: Any]
  }

  var openedURLs: [OpenedURL] = []
  var continuedUserActivities: [NSUserActivity] = []
  var lifeCycleEvents: [String] = []
  var shortcutItemTypes: [String] = []

  override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any]
  ) -> Bool {
    openedURLs.append(OpenedURL(url: url, options: options))
    return super.application(app, open: url, options: options)
  }

  override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    continuedUserActivities.append(userActivity)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }

  override func applicationDidBecomeActive(_ application: UIApplication) {
    lifeCycleEvents.append("applicationDidBecomeActive")
    super.applicationDidBecomeActive(application)
  }

  override func applicationWillResignActive(_ application: UIApplication) {
    lifeCycleEvents.append("applicationWillResignActive")
    super.applicationWillResignActive(application)
  }

  override func applicationWillEnterForeground(_ application: UIApplication) {
    lifeCycleEvents.append("applicationWillEnterForeground")
    super.applicationWillEnterForeground(application)
  }

  override func applicationDidEnterBackground(_ application: UIApplication) {
    lifeCycleEvents.append("applicationDidEnterBackground")
    super.applicationDidEnterBackground(application)
  }

#if os(iOS)
  override func application(
    _ application: UIApplication,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    shortcutItemTypes.append(shortcutItem.type)
    super.application(application, performActionFor: shortcutItem, completionHandler: completionHandler)
  }
#endif
}

/// Counts the notifications `RCTLinkingManager` posts for handled URLs. React Native keeps the
/// notification name private to its implementation file, so it's spelled out here.
private final class OpenURLNotificationRecorder: NSObject {
  private var urls: [String] = []

  override init() {
    super.init()
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(record(_:)),
      name: Notification.Name("RCTOpenURLNotification"),
      object: nil
    )
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
  }

  func count(of url: URL) -> Int {
    return urls.filter { $0 == url.absoluteString }.count
  }

  @objc
  private func record(_ notification: Notification) {
    if let url = notification.userInfo?["url"] as? String {
      urls.append(url)
    }
  }
}

#endif
