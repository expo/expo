import ExpoModulesTestCore
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

  func application(
    _ application: UIApplication,
    willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    return true
  }

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    return true
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

final class ExpoAppDelegateSubscriberManagerSpec: ExpoSpec {
  override class func spec() {
    describe("ExpoAppDelegateSubscriberManager") {
      MainActor.assumeIsolated {

        // MARK: - Selector Tests

        describe("selector forwarding") {
          let subscriber = MockAppDelegateSubscriber()

          beforeSuite {
            ExpoAppDelegateSubscriberRepository.registerSubscriber(subscriber)
          }

          afterSuite {
            ExpoAppDelegateSubscriberRepository.removeSubscriber(subscriber)
          }

          describe("non-void returning methods") {
            it("willFinishLaunchingWithOptions") {
              let result = ExpoAppDelegateSubscriberManager.application(UIApplication.shared, willFinishLaunchingWithOptions: nil)
              expect(result) == true
            }

            it("didFinishLaunchingWithOptions") {
              let result = ExpoAppDelegateSubscriberManager.application(UIApplication.shared, didFinishLaunchingWithOptions: nil)
              expect(result) == true
            }

            it("openURL") {
              let url = URL(string: "https://example.com")!
              let result = ExpoAppDelegateSubscriberManager.application(UIApplication.shared, open: url, options: [:])
              expect(result) == true
            }

            it("supportedInterfaceOrientationsFor") {
              let result = ExpoAppDelegateSubscriberManager.application(UIApplication.shared, supportedInterfaceOrientationsFor: nil)
              expect(result) == .portrait
            }

            it("willContinueUserActivityWithType") {
              let result = ExpoAppDelegateSubscriberManager.application(UIApplication.shared, willContinueUserActivityWithType: "test")
              expect(result) == true
            }
          }

          describe("void-returning methods") {
            it("applicationDidBecomeActive") {
              ExpoAppDelegateSubscriberManager.applicationDidBecomeActive(UIApplication.shared)
              expect(subscriber.didCallDidBecomeActive) == true
            }

            it("applicationWillResignActive") {
              ExpoAppDelegateSubscriberManager.applicationWillResignActive(UIApplication.shared)
              expect(subscriber.didCallWillResignActive) == true
            }

            it("applicationDidEnterBackground") {
              ExpoAppDelegateSubscriberManager.applicationDidEnterBackground(UIApplication.shared)
              expect(subscriber.didCallDidEnterBackground) == true
            }

            it("applicationWillEnterForeground") {
              ExpoAppDelegateSubscriberManager.applicationWillEnterForeground(UIApplication.shared)
              expect(subscriber.didCallWillEnterForeground) == true
            }

            it("applicationWillTerminate") {
              ExpoAppDelegateSubscriberManager.applicationWillTerminate(UIApplication.shared)
              expect(subscriber.didCallWillTerminate) == true
            }

            it("applicationDidReceiveMemoryWarning") {
              ExpoAppDelegateSubscriberManager.applicationDidReceiveMemoryWarning(UIApplication.shared)
              expect(subscriber.didCallDidReceiveMemoryWarning) == true
            }

            it("didRegisterForRemoteNotificationsWithDeviceToken") {
              let deviceToken = Data()
              ExpoAppDelegateSubscriberManager.application(UIApplication.shared, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
              expect(subscriber.didCallDidRegisterForRemoteNotifications) == true
            }

            it("didFailToRegisterForRemoteNotificationsWithError") {
              let error = NSError(domain: "test", code: 0)
              ExpoAppDelegateSubscriberManager.application(UIApplication.shared, didFailToRegisterForRemoteNotificationsWithError: error)
              expect(subscriber.didCallDidFailToRegisterForRemoteNotifications) == true
            }

            it("didUpdateUserActivity") {
              let userActivity = NSUserActivity(activityType: "test")
              ExpoAppDelegateSubscriberManager.application(UIApplication.shared, didUpdate: userActivity)
              expect(subscriber.didCallDidUpdateUserActivity) == true
            }

            it("didFailToContinueUserActivityWithType") {
              let error = NSError(domain: "test", code: 0)
              ExpoAppDelegateSubscriberManager.application(
                UIApplication.shared,
                didFailToContinueUserActivityWithType: "test",
                error: error
              )
              expect(subscriber.didCallDidFailToContinueUserActivity) == true
            }
          }

          describe("completion-handler-based methods") {
            it("handleEventsForBackgroundURLSession") {
              waitUntil { done in
                ExpoAppDelegateSubscriberManager.application(
                  UIApplication.shared,
                  handleEventsForBackgroundURLSession: "test-session",
                  completionHandler: {
                    expect(subscriber.didCallHandleBackgroundURLSession) == true
                    done()
                  }
                )
              }
            }

            it("didReceiveRemoteNotification") {
              waitUntil { done in
                ExpoAppDelegateSubscriberManager.application(
                  UIApplication.shared,
                  didReceiveRemoteNotification: [:],
                  fetchCompletionHandler: { _ in
                    expect(subscriber.didCallDidReceiveRemoteNotification) == true
                    done()
                  }
                )
              }
            }

            it("continueUserActivity") {
              waitUntil { done in
                let userActivity = NSUserActivity(activityType: NSUserActivityTypeBrowsingWeb)
                let result = ExpoAppDelegateSubscriberManager.application(
                  UIApplication.shared,
                  continue: userActivity,
                  restorationHandler: { _ in
                    done()
                  }
                )
                expect(result) == true
              }
            }

            it("performActionForShortcut") {
              waitUntil { done in
                let shortcutItem = UIApplicationShortcutItem(type: "test", localizedTitle: "Test")
                ExpoAppDelegateSubscriberManager.application(
                  UIApplication.shared,
                  performActionFor: shortcutItem,
                  completionHandler: { _ in
                    expect(subscriber.didCallPerformActionForShortcut) == true
                    done()
                  }
                )
              }
            }

            it("performFetch") {
              waitUntil { done in
                ExpoAppDelegateSubscriberManager.application(
                  UIApplication.shared,
                  performFetchWithCompletionHandler: { _ in
                    expect(subscriber.didCallPerformFetch) == true
                    done()
                  }
                )
              }
            }
          }
        }
      }
    }
  }
}
