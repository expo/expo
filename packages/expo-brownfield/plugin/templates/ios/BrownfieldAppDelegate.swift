internal import ExpoModulesCore
import UIKit

@objc
open class BrownfieldAppDelegate: UIResponder, UIApplicationDelegate {
  // TODO(pmleczek): Add shared instance to enable using single methods (?)

  // SECTION: Initializing the app
  open func application(
    _ application: UIApplication,
    willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    ExpoAppDelegateSubscriberManager.application(
      application, willFinishLaunchingWithOptions: launchOptions)
  }

  open func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    ExpoAppDelegateSubscriberManager.application(
      application, didFinishLaunchingWithOptions: launchOptions)
  }
  // END SECTION: Initializing the app

  // SECTION: Responding to App Life-Cycle Events
  open func applicationDidBecomeActive(_ application: UIApplication) {
    ExpoAppDelegateSubscriberManager.applicationDidBecomeActive(application)
  }

  open func applicationWillResignActive(_ application: UIApplication) {
    ExpoAppDelegateSubscriberManager.applicationWillResignActive(application)
  }

  open func applicationDidEnterBackground(_ application: UIApplication) {
    ExpoAppDelegateSubscriberManager.applicationDidEnterBackground(application)
  }

  open func applicationWillEnterForeground(_ application: UIApplication) {
    ExpoAppDelegateSubscriberManager.applicationWillEnterForeground(application)
  }

  open func applicationWillTerminate(_ application: UIApplication) {
    ExpoAppDelegateSubscriberManager.applicationWillTerminate(application)
  }
  // END SECTION: Responding to App Life-Cycle Events

  // SECTION: Responding to Environment Changes
  open func applicationDidReceiveMemoryWarning(_ application: UIApplication) {
    ExpoAppDelegateSubscriberManager.applicationDidReceiveMemoryWarning(application)
  }
  // END SECTION: Responding to Environment Changes

  // SECTION: Downloading Data in the Background
  open func application(
    _ application: UIApplication,
    handleEventsForBackgroundURLSession identifier: String,
    completionHandler: @escaping () -> Void
  ) {
    ExpoAppDelegateSubscriberManager.application(
      application,
      handleEventsForBackgroundURLSession: identifier,
      completionHandler: completionHandler
    )
  }
  // END SECTION: Downloading Data in the Background

  // SECTION: Handling Remote Notification Registration
  open func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    ExpoAppDelegateSubscriberManager.application(
      application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  open func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    ExpoAppDelegateSubscriberManager.application(
      application, didFailToRegisterForRemoteNotificationsWithError: error)
  }

  open func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    ExpoAppDelegateSubscriberManager.application(
      application,
      didReceiveRemoteNotification: userInfo,
      fetchCompletionHandler: completionHandler
    )
  }
  // END SECTION: Handling Remote Notification Registration

  // SECTION: Continuing User Activity and Handling Quick Actions
  open func application(
    _ application: UIApplication,
    willContinueUserActivityWithType userActivityType: String
  ) -> Bool {
    ExpoAppDelegateSubscriberManager.application(
      application, willContinueUserActivityWithType: userActivityType)
  }

  open func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    ExpoAppDelegateSubscriberManager.application(
      application, continue: userActivity, restorationHandler: restorationHandler)
  }

  open func application(
    _ application: UIApplication,
    didUpdate userActivity: NSUserActivity
  ) {
    ExpoAppDelegateSubscriberManager.application(application, didUpdate: userActivity)
  }

  open func application(
    _ application: UIApplication,
    didFailToContinueUserActivityWithType userActivityType: String,
    error: Error
  ) {
    ExpoAppDelegateSubscriberManager.application(
      application, didFailToContinueUserActivityWithType: userActivityType, error: error)
  }

  open func application(
    _ application: UIApplication,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    ExpoAppDelegateSubscriberManager.application(
      application, performActionFor: shortcutItem, completionHandler: completionHandler)
  }
  // END SECTION: Continuing User Activity and Handling Quick Actions

  // SECTION: Background Fetch
  open func application(
    _ application: UIApplication,
    performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    ExpoAppDelegateSubscriberManager.application(
      application, performFetchWithCompletionHandler: completionHandler)
  }
  // END SECTION: Background Fetch

  // SECTION: Opening a URL-Specified Resource
  open func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    ExpoAppDelegateSubscriberManager.application(app, open: url, options: options)
  }
  // END SECTION: Opening a URL-Specified Resource

  // SECTION: Managing Interface Geometry
  open func application(
    _ application: UIApplication,
    supportedInterfaceOrientationsFor window: UIWindow?
  ) -> UIInterfaceOrientationMask {
    ExpoAppDelegateSubscriberManager.application(
      application, supportedInterfaceOrientationsFor: window)
  }
  // END SECTION: Managing Interface Geometry
}
