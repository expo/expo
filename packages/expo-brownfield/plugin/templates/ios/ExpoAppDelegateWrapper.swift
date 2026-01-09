internal import Expo
internal import React

public class ExpoAppDelegateWrapper {
  private let expoDelegate: ExpoAppDelegate

  init(factory: RCTReactNativeFactory) {
    expoDelegate = ExpoAppDelegate()
  }

  func recreateRootView(
    withBundleURL: URL?,
    moduleName: String?,
    initialProps: [AnyHashable: Any]?,
    launchOptions: [AnyHashable: Any]?
  ) -> UIView {
    expoDelegate.recreateRootView(
      withBundleURL: withBundleURL,
      moduleName: moduleName,
      initialProps: initialProps,
      launchOptions: launchOptions
    )
  }

  // Below sections match sections from ExpoAppDelegate.swift:
  // https://github.com/expo/expo/blob/main/packages/expo/ios/AppDelegates/ExpoAppDelegate.swift
  // SECTION: Initializing the app
  func application(
    _ application: UIApplication,
    willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    expoDelegate.application(application, willFinishLaunchingWithOptions: launchOptions)
  }

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    expoDelegate.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // END SECTION: Initializing the app

  // SECTION: Configuring and discarding scenes
  // TODO: Not defined in ExpoAppDelegate yet
  // END SECTION: Configuring and discarding scenes

  // SECTION: Responding to App Life-Cycle Events
  func applicationDidBecomeActive(_ application: UIApplication) {
    expoDelegate.applicationDidBecomeActive(application)
  }

  func applicationWillResignActive(_ application: UIApplication) {
    expoDelegate.applicationWillResignActive(application)
  }

  func applicationDidEnterBackground(_ application: UIApplication) {
    expoDelegate.applicationDidEnterBackground(application)
  }

  func applicationWillEnterForeground(_ application: UIApplication) {
    expoDelegate.applicationWillEnterForeground(application)
  }

  func applicationWillTerminate(_ application: UIApplication) {
    expoDelegate.applicationWillTerminate(application)
  }

  // END SECTION: Responding to App Life-Cycle Events

  // SECTION: Responding to Environment Changes
  func applicationDidReceiveMemoryWarning(_ application: UIApplication) {
    expoDelegate.applicationDidReceiveMemoryWarning(application)
  }

  // END SECTION: Responding to Environment Changes

  // SECTION: Managing App State Restoration
  // TODO: Not defined in ExpoAppDelegate yet
  // END SECTION: Managing App State Restoration

  // SECTION: Downloading Data in the Background
  func application(
    _ application: UIApplication,
    handleEventsForBackgroundURLSession identifier: String,
    completionHandler: @escaping () -> Void
  ) {
    expoDelegate.application(
      application,
      handleEventsForBackgroundURLSession: identifier,
      completionHandler: completionHandler
    )
  }

  // END SECTION: Downloading Data in the Background

  // SECTION: Handling Remote Notification Registration
  func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    expoDelegate.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    expoDelegate.application(application, didFailToRegisterForRemoteNotificationsWithError: error)
  }

  func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    expoDelegate.application(
      application,
      didReceiveRemoteNotification: userInfo,
      fetchCompletionHandler: completionHandler
    )
  }

  // END SECTION: Handling Remote Notification Registration

  // SECTION: Continuing User Activity and Handling Quick Actions
  func application(_ application: UIApplication, willContinueUserActivityWithType userActivityType: String) -> Bool {
    expoDelegate.application(application, willContinueUserActivityWithType: userActivityType)
  }

  // func application(
  // Expo implementation
  //   _ application: UIApplication,
  //   continue userActivity: NSUserActivity,
  //   restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  // ) -> Bool {
  //   return expoDelegate.application(application, continue: userActivity, restorationHandler: restorationHandler)
  // }
  // Expo iOS app implementation - Universal Links
  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
    return expoDelegate
      .application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }

  func application(_ application: UIApplication, didUpdate userActivity: NSUserActivity) {
    expoDelegate.application(application, didUpdate: userActivity)
  }

  func application(
    _ application: UIApplication,
    didFailToContinueUserActivityWithType userActivityType: String,
    error: Error
  ) {
    expoDelegate.application(application, didFailToContinueUserActivityWithType: userActivityType, error: error)
  }

  func application(
    _ application: UIApplication,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    expoDelegate.application(application, performActionFor: shortcutItem, completionHandler: completionHandler)
  }

  // END SECTION: Continuing User Activity and Handling Quick Actions

  // SECTION: Background Fetch
  func application(
    _ application: UIApplication,
    performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    expoDelegate.application(application, performFetchWithCompletionHandler: completionHandler)
  }

  // TODO: Interacting with WatchKit and HealthKit is not yet implemented
  //  in ExpoAppDelegate
  // END SECTION: Background Fetch

  // SECTION: Opening a URL-Specified Resource
  // Expo implementation
  // func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) ->
  // Bool {
  //   return expoDelegate.application(app, open: url, options: options)
  // }
  // Expo iOS app implementation - Linking API
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    expoDelegate.application(app, open: url, options: options) ||
      RCTLinkingManager.application(app, open: url, options: options) || false
  }

  // TODO: Disallowing Specified App Extension Types, handling SiriKit Intents
  //  and CloudKit Invitations are not yet implemented in ExpoAppDelegate
  // END SECTION: Opening a URL-Specified Resource

  // SECTION: Managing Interface Geometry
  // Sets allowed orientations for the application. It will use the values from `Info.plist`as the orientation mask
  // unless a subscriber requested
  // a different orientation.
  func application(
    _ application: UIApplication,
    supportedInterfaceOrientationsFor window: UIWindow?
  ) -> UIInterfaceOrientationMask {
    expoDelegate.application(application, supportedInterfaceOrientationsFor: window)
  }
  // END SECTION: Managing Interface Geometry
}
