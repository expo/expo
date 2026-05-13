import Foundation
import ExpoModulesCore

/**
 Allows classes extending `ExpoAppDelegateSubscriber` to hook into project's app delegate
 by forwarding `UIApplicationDelegate` events to the subscribers.

 Keep functions and markers in sync with https://developer.apple.com/documentation/uikit/uiapplicationdelegate
 */
@objc(EXExpoAppDelegate)
open class ExpoAppDelegate: UIResponder, UIApplicationDelegate {
  override public init() {
    // The subscribers are initializing and registering before the main code starts executing.
    // Here we're letting them know when the `AppDelegate` is being created,
    // which happens at the beginning of the main code execution and before launching the app.
    ExpoAppDelegateSubscriberRepository.subscribers.forEach {
      $0.appDelegateWillBeginInitialization?()
    }
    super.init()
  }

#if os(macOS)
  required public init?(coder: NSCoder) {
    super.init(coder: coder)
  }
#endif

  // MARK: - Initializing the App
#if os(iOS) || os(tvOS)

  open func application(
    _ application: UIApplication,
    willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    return ExpoAppDelegateSubscriberManager.application(application, willFinishLaunchingWithOptions: launchOptions)
  }

  open func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    return ExpoAppDelegateSubscriberManager.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

#elseif os(macOS)
  open func applicationWillFinishLaunching(_ notification: Notification) {
    ExpoAppDelegateSubscriberManager.applicationWillFinishLaunching(notification)
  }

  open func applicationDidFinishLaunching(_ notification: Notification) {
    ExpoAppDelegateSubscriberManager.applicationDidFinishLaunching(notification)
  }

  // TODO: - Configuring and Discarding Scenes
#endif

  // MARK: - Responding to App Life-Cycle Events

#if os(iOS) || os(tvOS)

  @objc
  open func applicationDidBecomeActive(_ application: UIApplication) {
    ExpoAppDelegateSubscriberManager.applicationDidBecomeActive(application)
  }

  @objc
  open func applicationWillResignActive(_ application: UIApplication) {
    ExpoAppDelegateSubscriberManager.applicationWillResignActive(application)
  }

  @objc
  open func applicationDidEnterBackground(_ application: UIApplication) {
    ExpoAppDelegateSubscriberManager.applicationDidEnterBackground(application)
  }

  open func applicationWillEnterForeground(_ application: UIApplication) {
    ExpoAppDelegateSubscriberManager.applicationWillEnterForeground(application)
  }

  open func applicationWillTerminate(_ application: UIApplication) {
    ExpoAppDelegateSubscriberManager.applicationWillTerminate(application)
  }

#elseif os(macOS)
  @objc
  open func applicationDidBecomeActive(_ notification: Notification) {
    ExpoAppDelegateSubscriberManager.applicationDidBecomeActive(notification)
  }

  @objc
  open func applicationWillResignActive(_ notification: Notification) {
    ExpoAppDelegateSubscriberManager.applicationWillResignActive(notification)
  }

  @objc
  open func applicationDidHide(_ notification: Notification) {
    ExpoAppDelegateSubscriberManager.applicationDidHide(notification)
  }

  open func applicationWillUnhide(_ notification: Notification) {
    ExpoAppDelegateSubscriberManager.applicationWillUnhide(notification)
  }

  open func applicationWillTerminate(_ notification: Notification) {
    ExpoAppDelegateSubscriberManager.applicationWillTerminate(notification)
  }
#endif

  // MARK: - Responding to Environment Changes

#if os(iOS) || os(tvOS)

  open func applicationDidReceiveMemoryWarning(_ application: UIApplication) {
    ExpoAppDelegateSubscriberManager.applicationDidReceiveMemoryWarning(application)
  }

#endif

  // TODO: - Managing App State Restoration

  // MARK: - Downloading Data in the Background

#if os(iOS) || os(tvOS)
  open func application(
    _ application: UIApplication,
    handleEventsForBackgroundURLSession identifier: String,
    completionHandler: @escaping () -> Void
  ) {
    ExpoAppDelegateSubscriberManager.application(application, handleEventsForBackgroundURLSession: identifier, completionHandler: completionHandler)
  }

#endif

  // MARK: - Handling Remote Notification Registration

  open func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    ExpoAppDelegateSubscriberManager.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  open func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    ExpoAppDelegateSubscriberManager.application(application, didFailToRegisterForRemoteNotificationsWithError: error)
  }

#if os(iOS) || os(tvOS)
  open func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    ExpoAppDelegateSubscriberManager.application(application, didReceiveRemoteNotification: userInfo, fetchCompletionHandler: completionHandler)
  }

#elseif os(macOS)
  open func application(
    _ application: NSApplication,
    didReceiveRemoteNotification userInfo: [String: Any]
  ) {
    ExpoAppDelegateSubscriberManager.application(application, didReceiveRemoteNotification: userInfo)
  }
#endif

  // MARK: - Continuing User Activity and Handling Quick Actions

  open func application(_ application: UIApplication, willContinueUserActivityWithType userActivityType: String) -> Bool {
    return ExpoAppDelegateSubscriberManager.application(application, willContinueUserActivityWithType: userActivityType)
  }

#if os(iOS) || os(tvOS)
  open func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    return ExpoAppDelegateSubscriberManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }
#elseif os(macOS)
  open func application(
    _ application: NSApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([any NSUserActivityRestoring]) -> Void
  ) -> Bool {
    return ExpoAppDelegateSubscriberManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }
#endif

  open func application(_ application: UIApplication, didUpdate userActivity: NSUserActivity) {
    return ExpoAppDelegateSubscriberManager.application(application, didUpdate: userActivity)
  }

  open func application(_ application: UIApplication, didFailToContinueUserActivityWithType userActivityType: String, error: Error) {
    return ExpoAppDelegateSubscriberManager.application(application, didFailToContinueUserActivityWithType: userActivityType, error: error)
  }

#if os(iOS)
  open func application(
    _ application: UIApplication,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    ExpoAppDelegateSubscriberManager.application(application, performActionFor: shortcutItem, completionHandler: completionHandler)
  }
#endif

  // MARK: - Background Fetch

#if os(iOS) || os(tvOS)
  open func application(
    _ application: UIApplication,
    performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    ExpoAppDelegateSubscriberManager.application(application, performFetchWithCompletionHandler: completionHandler)
  }

  // TODO: - Interacting With WatchKit

  // TODO: - Interacting With HealthKit
#endif

  // MARK: - Opening a URL-Specified Resource
#if os(iOS) || os(tvOS)

  open func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    return ExpoAppDelegateSubscriberManager.application(app, open: url, options: options)
  }
#elseif os(macOS)
  open func application(_ app: NSApplication, open urls: [URL]) {
    ExpoAppDelegateSubscriberManager.application(app, open: urls)
  }
#endif
  // TODO: - Disallowing Specified App Extension Types

  // TODO: - Handling SiriKit Intents

  // TODO: - Handling CloudKit Invitations

  // MARK: - Managing Interface Geometry
#if os(iOS)

  /**
   * Sets allowed orientations for the application. It will use the values from `Info.plist`as the orientation mask unless a subscriber requested
   * a different orientation.
   */
  open func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return ExpoAppDelegateSubscriberManager.application(application, supportedInterfaceOrientationsFor: window)
  }
#endif
}
