import Testing
import UIKit

@testable import ExpoModulesCore

// Mock subscriber for testing
class MockAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  var didCallDidBecomeActive = false
  var didCallWillResignActive = false
  var didCallDidEnterBackground = false
  var didCallWillEnterForeground = false
  var didCallWillTerminate = false
  var didCallDidReceiveMemoryWarning = false
  var didCallHandleBackgroundURLSession = false
  var didCallDidRegisterForRemoteNotifications = false
  var didCallDidFailToRegisterForRemoteNotifications = false
  var didCallDidReceiveRemoteNotification = false
  var didCallDidUpdateUserActivity = false
  var didCallDidFailToContinueUserActivity = false
  var didCallPerformActionForShortcut = false
  var didCallPerformFetch = false
  var didCallFinishLaunchingWithOptions = false
  var didCallwillFinishLaunchingWithOptions = false

  func application(
    _ application: UIApplication,
    willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    didCallwillFinishLaunchingWithOptions = true
    return true
  }

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    didCallFinishLaunchingWithOptions = true
    return false // return value is ignored by ExpoAppDelegateSubscriberManager
  }

  func applicationDidBecomeActive(_ application: UIApplication) {
    didCallDidBecomeActive = true
  }

  func applicationWillResignActive(_ application: UIApplication) {
    didCallWillResignActive = true
  }

  func applicationDidEnterBackground(_ application: UIApplication) {
    didCallDidEnterBackground = true
  }

  func applicationWillEnterForeground(_ application: UIApplication) {
    didCallWillEnterForeground = true
  }

  func applicationWillTerminate(_ application: UIApplication) {
    didCallWillTerminate = true
  }

  func applicationDidReceiveMemoryWarning(_ application: UIApplication) {
    didCallDidReceiveMemoryWarning = true
  }

  func application(
    _ application: UIApplication,
    handleEventsForBackgroundURLSession identifier: String,
    completionHandler: @escaping () -> Void
  ) {
    didCallHandleBackgroundURLSession = true
    completionHandler()
  }

  func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    didCallDidRegisterForRemoteNotifications = true
  }

  func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    didCallDidFailToRegisterForRemoteNotifications = true
  }

  func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    didCallDidReceiveRemoteNotification = true
    completionHandler(.noData)
  }

  func application(
    _ application: UIApplication,
    willContinueUserActivityWithType userActivityType: String
  ) -> Bool {
    return true
  }

  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    restorationHandler(nil)
    return true
  }

  func application(_ application: UIApplication, didUpdate userActivity: NSUserActivity) {
    didCallDidUpdateUserActivity = true
  }

  func application(
    _ application: UIApplication,
    didFailToContinueUserActivityWithType userActivityType: String,
    error: Error
  ) {
    didCallDidFailToContinueUserActivity = true
  }

  func application(
    _ application: UIApplication,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    didCallPerformActionForShortcut = true
    completionHandler(true)
  }

  func application(
    _ application: UIApplication,
    performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    didCallPerformFetch = true
    completionHandler(.noData)
  }

  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return true
  }

  func application(
    _ application: UIApplication,
    supportedInterfaceOrientationsFor window: UIWindow?
  ) -> UIInterfaceOrientationMask {
    return .portrait
  }
}

@Suite
@MainActor
final class ExpoAppDelegateSubscriberManagerTests {
  let subscriber = MockAppDelegateSubscriber()

  init() {
    ExpoAppDelegateSubscriberRepository.registerSubscriber(subscriber)
  }

  // MARK: - Non-void returning methods

  @Test
  func willFinishLaunchingWithOptions() {
    let result = ExpoAppDelegateSubscriberManager.application(UIApplication.shared, willFinishLaunchingWithOptions: nil)
    #expect(result == true) // NOTE: could also be true if no subscribers respond to selector
    #expect(subscriber.didCallwillFinishLaunchingWithOptions == true)
  }

  @Test
  func openURL() {
    let url = URL(string: "https://example.com")!
    let result = ExpoAppDelegateSubscriberManager.application(UIApplication.shared, open: url, options: [:])
    #expect(result == true)
  }

  @Test
  func supportedInterfaceOrientationsFor() {
    let result = ExpoAppDelegateSubscriberManager.application(UIApplication.shared, supportedInterfaceOrientationsFor: nil)
    #expect(result == .portrait)
  }

  @Test
  func willContinueUserActivityWithType() {
    let result = ExpoAppDelegateSubscriberManager.application(UIApplication.shared, willContinueUserActivityWithType: "test")
    #expect(result == true)
  }

  @Test
  func didFinishLaunchingWithOptions() {
    let result = ExpoAppDelegateSubscriberManager.application(UIApplication.shared, didFinishLaunchingWithOptions: nil)
    #expect(result == true) // always true
    #expect(subscriber.didCallFinishLaunchingWithOptions == true)
  }

  // MARK: - Void-returning methods

  @Test
  func applicationDidBecomeActive() {
    ExpoAppDelegateSubscriberManager.applicationDidBecomeActive(UIApplication.shared)
    #expect(subscriber.didCallDidBecomeActive == true)
  }

  @Test
  func applicationWillResignActive() {
    ExpoAppDelegateSubscriberManager.applicationWillResignActive(UIApplication.shared)
    #expect(subscriber.didCallWillResignActive == true)
  }

  @Test
  func applicationDidEnterBackground() {
    ExpoAppDelegateSubscriberManager.applicationDidEnterBackground(UIApplication.shared)
    #expect(subscriber.didCallDidEnterBackground == true)
  }

  @Test
  func applicationWillEnterForeground() {
    ExpoAppDelegateSubscriberManager.applicationWillEnterForeground(UIApplication.shared)
    #expect(subscriber.didCallWillEnterForeground == true)
  }

  @Test
  func applicationWillTerminate() {
    ExpoAppDelegateSubscriberManager.applicationWillTerminate(UIApplication.shared)
    #expect(subscriber.didCallWillTerminate == true)
  }

  @Test
  func applicationDidReceiveMemoryWarning() {
    ExpoAppDelegateSubscriberManager.applicationDidReceiveMemoryWarning(UIApplication.shared)
    #expect(subscriber.didCallDidReceiveMemoryWarning == true)
  }

  @Test
  func didRegisterForRemoteNotificationsWithDeviceToken() {
    let deviceToken = Data()
    ExpoAppDelegateSubscriberManager.application(UIApplication.shared, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
    #expect(subscriber.didCallDidRegisterForRemoteNotifications == true)
  }

  @Test
  func didFailToRegisterForRemoteNotificationsWithError() {
    let error = NSError(domain: "test", code: 0)
    ExpoAppDelegateSubscriberManager.application(UIApplication.shared, didFailToRegisterForRemoteNotificationsWithError: error)
    #expect(subscriber.didCallDidFailToRegisterForRemoteNotifications == true)
  }

  @Test
  func didUpdateUserActivity() {
    let userActivity = NSUserActivity(activityType: "test")
    ExpoAppDelegateSubscriberManager.application(UIApplication.shared, didUpdate: userActivity)
    #expect(subscriber.didCallDidUpdateUserActivity == true)
  }

  @Test
  func didFailToContinueUserActivityWithType() {
    let error = NSError(domain: "test", code: 0)
    ExpoAppDelegateSubscriberManager.application(
      UIApplication.shared,
      didFailToContinueUserActivityWithType: "test",
      error: error
    )
    #expect(subscriber.didCallDidFailToContinueUserActivity == true)
  }

  // MARK: - Completion-handler-based methods

  @Test
  func handleEventsForBackgroundURLSession() async {
    await withCheckedContinuation { continuation in
      ExpoAppDelegateSubscriberManager.application(
        UIApplication.shared,
        handleEventsForBackgroundURLSession: "test-session",
        completionHandler: {
          #expect(self.subscriber.didCallHandleBackgroundURLSession == true)
          continuation.resume()
        }
      )
    }
  }

  @Test
  func didReceiveRemoteNotification() async {
    await withCheckedContinuation { continuation in
      ExpoAppDelegateSubscriberManager.application(
        UIApplication.shared,
        didReceiveRemoteNotification: [:],
        fetchCompletionHandler: { _ in
          #expect(self.subscriber.didCallDidReceiveRemoteNotification == true)
          continuation.resume()
        }
      )
    }
  }

  @Test
  func continueUserActivity() async {
    await withCheckedContinuation { continuation in
      let userActivity = NSUserActivity(activityType: NSUserActivityTypeBrowsingWeb)
      let result = ExpoAppDelegateSubscriberManager.application(
        UIApplication.shared,
        continue: userActivity,
        restorationHandler: { _ in
          continuation.resume()
        }
      )
      #expect(result == true)
    }
  }

  @Test
  func performActionForShortcut() async {
    await withCheckedContinuation { continuation in
      let shortcutItem = UIApplicationShortcutItem(type: "test", localizedTitle: "Test")
      ExpoAppDelegateSubscriberManager.application(
        UIApplication.shared,
        performActionFor: shortcutItem,
        completionHandler: { _ in
          #expect(self.subscriber.didCallPerformActionForShortcut == true)
          continuation.resume()
        }
      )
    }
  }

  @Test
  func performFetch() async {
    await withCheckedContinuation { continuation in
      ExpoAppDelegateSubscriberManager.application(
        UIApplication.shared,
        performFetchWithCompletionHandler: { _ in
          #expect(self.subscriber.didCallPerformFetch == true)
          continuation.resume()
        }
      )
    }
  }
}
