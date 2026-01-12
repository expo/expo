import UIKit

@objc(BrownfieldAppDelegate)
open class BrownfieldAppDelegate: UIResponder, UIApplicationDelegate {
  private var expoWrapper: ExpoAppDelegateWrapper? {
    ReactNativeHostManager.shared.expoDelegateWrapper
  }

  // SECTION: Initializing the app
  open func application(
    _ application: UIApplication,
    willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    expoWrapper?.application(application, willFinishLaunchingWithOptions: launchOptions) ?? true
  }

  open func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    expoWrapper?.application(application, didFinishLaunchingWithOptions: launchOptions) ?? true
  }

  // END SECTION: Initializing the app

  // SECTION: Responding to App Life-Cycle Events
  open func applicationDidBecomeActive(_ application: UIApplication) {
    expoWrapper?.applicationDidBecomeActive(application)
  }

  open func applicationWillResignActive(_ application: UIApplication) {
    expoWrapper?.applicationWillResignActive(application)
  }

  open func applicationDidEnterBackground(_ application: UIApplication) {
    expoWrapper?.applicationDidEnterBackground(application)
  }

  open func applicationWillEnterForeground(_ application: UIApplication) {
    expoWrapper?.applicationWillEnterForeground(application)
  }

  open func applicationWillTerminate(_ application: UIApplication) {
    expoWrapper?.applicationWillTerminate(application)
  }

  // END SECTION: Responding to App Life-Cycle Events

  // SECTION: Responding to Environment Changes
  open func applicationDidReceiveMemoryWarning(_ application: UIApplication) {
    expoWrapper?.applicationDidReceiveMemoryWarning(application)
  }

  // END SECTION: Responding to Environment Changes

  // SECTION: Downloading Data in the Background
  open func application(
    _ application: UIApplication,
    handleEventsForBackgroundURLSession identifier: String,
    completionHandler: @escaping () -> Void
  ) {
    expoWrapper?.application(
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
    expoWrapper?.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  open func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    expoWrapper?.application(application, didFailToRegisterForRemoteNotificationsWithError: error)
  }

  open func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    expoWrapper?.application(
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
    expoWrapper?.application(application, willContinueUserActivityWithType: userActivityType) ?? false
  }

  open func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    expoWrapper?.application(application, continue: userActivity, restorationHandler: restorationHandler) ?? false
  }

  open func application(
    _ application: UIApplication,
    didUpdate userActivity: NSUserActivity
  ) {
    expoWrapper?.application(application, didUpdate: userActivity)
  }

  open func application(
    _ application: UIApplication,
    didFailToContinueUserActivityWithType userActivityType: String,
    error: Error
  ) {
    expoWrapper?.application(application, didFailToContinueUserActivityWithType: userActivityType, error: error)
  }

  open func application(
    _ application: UIApplication,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    expoWrapper?.application(application, performActionFor: shortcutItem, completionHandler: completionHandler)
  }

  // END SECTION: Continuing User Activity and Handling Quick Actions

  // SECTION: Background Fetch
  open func application(
    _ application: UIApplication,
    performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    expoWrapper?.application(application, performFetchWithCompletionHandler: completionHandler)
  }

  // END SECTION: Background Fetch

  // SECTION: Opening a URL-Specified Resource
  open func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    expoWrapper?.application(app, open: url, options: options) ?? false
  }

  // END SECTION: Opening a URL-Specified Resource

  // SECTION: Managing Interface Geometry
  open func application(
    _ application: UIApplication,
    supportedInterfaceOrientationsFor window: UIWindow?
  ) -> UIInterfaceOrientationMask {
    expoWrapper?.application(application, supportedInterfaceOrientationsFor: window) ?? .all
  }
  // END SECTION: Managing Interface Geometry
}
