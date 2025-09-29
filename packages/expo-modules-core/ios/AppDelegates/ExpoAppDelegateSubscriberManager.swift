import Dispatch
import Foundation

public class ExpoAppDelegateSubscriberManager: NSObject {
#if os(iOS) || os(tvOS)

  @objc
  public static func application(
    _ application: UIApplication,
    willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let parsedSubscribers = ExpoAppDelegateSubscriberRepository.subscribers.filter {
      $0.responds(to: #selector(application(_:willFinishLaunchingWithOptions:)))
    }

    // If we can't find a subscriber that implements `willFinishLaunchingWithOptions`, we will delegate the decision if we can handel the passed URL to
    // the `didFinishLaunchingWithOptions` method by returning `true` here.
    //  You can read more about how iOS handles deep links here: https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1623112-application#discussion
    if parsedSubscribers.isEmpty {
      return true
    }

    return parsedSubscribers.reduce(false) { result, subscriber in
      return subscriber.application?(application, willFinishLaunchingWithOptions: launchOptions) ?? false || result
    }
  }

  @objc
  public static func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    ExpoAppDelegateSubscriberRepository.subscribers.forEach { subscriber in
      // Subscriber result is ignored as it doesn't matter if any subscriber handled the incoming URL – we always return `true` anyway.
      _ = subscriber.application?(application, didFinishLaunchingWithOptions: launchOptions)
    }

    return true
  }

#elseif os(macOS)
  @objc
  public static func applicationWillFinishLaunching(_ notification: Notification) {
    let parsedSubscribers = ExpoAppDelegateSubscriberRepository.subscribers.filter {
      $0.responds(to: #selector(applicationWillFinishLaunching(_:)))
    }

    parsedSubscribers.forEach { subscriber in
      subscriber.applicationWillFinishLaunching?(notification)
    }
  }

  @objc
  public static func applicationDidFinishLaunching(_ notification: Notification) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { subscriber in
        // Subscriber result is ignored as it doesn't matter if any subscriber handled the incoming URL – we always return `true` anyway.
        _ = subscriber.applicationDidFinishLaunching?(notification)
      }
  }

  // TODO: - Configuring and Discarding Scenes
#endif

  // MARK: - Responding to App Life-Cycle Events

#if os(iOS) || os(tvOS)

  @objc
  public static func applicationDidBecomeActive(_ application: UIApplication) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationDidBecomeActive?(application) }
  }

  @objc
  public static func applicationWillResignActive(_ application: UIApplication) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationWillResignActive?(application) }
  }

  @objc
  public static func applicationDidEnterBackground(_ application: UIApplication) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationDidEnterBackground?(application) }
  }

  @objc
  public static func applicationWillEnterForeground(_ application: UIApplication) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationWillEnterForeground?(application) }
  }

  @objc
  public static func applicationWillTerminate(_ application: UIApplication) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationWillTerminate?(application) }
  }

#elseif os(macOS)
  @objc
  public static func applicationDidBecomeActive(_ notification: Notification) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationDidBecomeActive?(notification) }
  }

  @objc
  public static func applicationWillResignActive(_ notification: Notification) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationWillResignActive?(notification) }
  }

  @objc
  public static func applicationDidHide(_ notification: Notification) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationDidHide?(notification) }
  }

  @objc
  public static func applicationWillUnhide(_ notification: Notification) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationWillUnhide?(notification) }
  }

  @objc
  public static func applicationWillTerminate(_ notification: Notification) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationWillTerminate?(notification) }
  }
#endif

  // TODO: - Responding to Environment Changes

  // TODO: - Managing App State Restoration

  // MARK: - Downloading Data in the Background

#if os(iOS) || os(tvOS)
  @objc
  public static func application(
    _ application: UIApplication,
    handleEventsForBackgroundURLSession identifier: String,
    completionHandler: @escaping () -> Void
  ) {
    let selector = #selector(application(_:handleEventsForBackgroundURLSession:completionHandler:))
    let subs = ExpoAppDelegateSubscriberRepository.subscribers.filter { $0.responds(to: selector) }
    var subscribersLeft = subs.count
    let dispatchQueue = DispatchQueue(label: "expo.application.handleBackgroundEvents")

    let handler = {
      dispatchQueue.sync {
        subscribersLeft -= 1

        if subscribersLeft == 0 {
          completionHandler()
        }
      }
    }

    if subs.isEmpty {
      completionHandler()
    } else {
      subs.forEach {
        $0.application?(application, handleEventsForBackgroundURLSession: identifier, completionHandler: handler)
      }
    }
  }

#endif

  // MARK: - Handling Remote Notification Registration

  @objc
  public static func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.application?(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken) }
  }

  @objc
  public static func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.application?(application, didFailToRegisterForRemoteNotificationsWithError: error) }
  }

#if os(iOS) || os(tvOS)
  @objc
  public static func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    let selector = #selector(application(_:didReceiveRemoteNotification:fetchCompletionHandler:))
    let subs = ExpoAppDelegateSubscriberRepository.subscribers.filter { $0.responds(to: selector) }
    var subscribersLeft = subs.count
    let dispatchQueue = DispatchQueue(label: "expo.application.remoteNotification", qos: .userInteractive)
    var failedCount = 0
    var newDataCount = 0

    let handler = { (result: UIBackgroundFetchResult) in
      dispatchQueue.sync {
        if result == .failed {
          failedCount += 1
        } else if result == .newData {
          newDataCount += 1
        }

        subscribersLeft -= 1

        if subscribersLeft == 0 {
          if newDataCount > 0 {
            completionHandler(.newData)
          } else if failedCount > 0 {
            completionHandler(.failed)
          } else {
            completionHandler(.noData)
          }
        }
      }
    }

    if subs.isEmpty {
      completionHandler(.noData)
    } else {
      subs.forEach { subscriber in
        subscriber.application?(application, didReceiveRemoteNotification: userInfo, fetchCompletionHandler: handler)
      }
    }
  }

#elseif os(macOS)
  @objc
  public static func application(
    _ application: NSApplication,
    didReceiveRemoteNotification userInfo: [String: Any]
  ) {
    let selector = #selector(application(_:didReceiveRemoteNotification:))
    let subs = ExpoAppDelegateSubscriberRepository.subscribers.filter { $0.responds(to: selector) }

    subs.forEach { subscriber in
      subscriber.application?(application, didReceiveRemoteNotification: userInfo)
    }
  }
#endif

  // MARK: - Continuing User Activity and Handling Quick Actions

  @objc
  public static func application(_ application: UIApplication, willContinueUserActivityWithType userActivityType: String) -> Bool {
    return ExpoAppDelegateSubscriberRepository
      .subscribers
      .reduce(false) { result, subscriber in
        return subscriber.application?(application, willContinueUserActivityWithType: userActivityType) ?? false || result
      }
  }

#if os(iOS) || os(tvOS)
  @objc
  public static func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let selector = #selector(application(_:continue:restorationHandler:))
    let subs = ExpoAppDelegateSubscriberRepository.subscribers.filter { $0.responds(to: selector) }
    var subscribersLeft = subs.count
    let dispatchQueue = DispatchQueue(label: "expo.application.continueUserActivity", qos: .userInteractive)
    var allRestorableObjects = [UIUserActivityRestoring]()

    let handler = { (restorableObjects: [UIUserActivityRestoring]?) in
      dispatchQueue.sync {
        if let restorableObjects = restorableObjects {
          allRestorableObjects.append(contentsOf: restorableObjects)
        }

        subscribersLeft -= 1

        if subscribersLeft == 0 {
          restorationHandler(allRestorableObjects)
        }
      }
    }

    return subs.reduce(false) { result, subscriber in
      return subscriber.application?(application, continue: userActivity, restorationHandler: handler) ?? false || result
    }
  }
#elseif os(macOS)
  @objc
  public static func application(
    _ application: NSApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([any NSUserActivityRestoring]) -> Void
  ) -> Bool {
    let selector = #selector(application(_:continue:restorationHandler:))
    let subs = ExpoAppDelegateSubscriberRepository.subscribers.filter { $0.responds(to: selector) }
    var subscribersLeft = subs.count
    let dispatchQueue = DispatchQueue(label: "expo.application.continueUserActivity", qos: .userInteractive)
    var allRestorableObjects = [NSUserActivityRestoring]()

    let handler = { (restorableObjects: [NSUserActivityRestoring]?) in
      dispatchQueue.sync {
        if let restorableObjects = restorableObjects {
          allRestorableObjects.append(contentsOf: restorableObjects)
        }

        subscribersLeft -= 1

        if subscribersLeft == 0 {
          restorationHandler(allRestorableObjects)
        }
      }
    }

    return subs.reduce(false) { result, subscriber in
      return subscriber.application?(application, continue: userActivity, restorationHandler: handler) ?? false || result
    }
  }
#endif

  @objc
  public static func application(_ application: UIApplication, didUpdate userActivity: NSUserActivity) {
    return ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.application?(application, didUpdate: userActivity) }
  }

  @objc
  public static func application(_ application: UIApplication, didFailToContinueUserActivityWithType userActivityType: String, error: Error) {
    return ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach {
        $0.application?(application, didFailToContinueUserActivityWithType: userActivityType, error: error)
      }
  }

#if os(iOS)
  @objc
  public static func application(
    _ application: UIApplication,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    let selector = #selector(application(_:performActionFor:completionHandler:))
    let subs = ExpoAppDelegateSubscriberRepository.subscribers.filter { $0.responds(to: selector) }
    var subscribersLeft = subs.count
    var result: Bool = false
    let dispatchQueue = DispatchQueue(label: "expo.application.performAction", qos: .userInteractive)

    let handler = { (succeeded: Bool) in
      dispatchQueue.sync {
        result = result || succeeded
        subscribersLeft -= 1

        if subscribersLeft == 0 {
          completionHandler(result)
        }
      }
    }

    if subs.isEmpty {
      completionHandler(result)
    } else {
      subs.forEach { subscriber in
        subscriber.application?(application, performActionFor: shortcutItem, completionHandler: handler)
      }
    }
  }
#endif

  // MARK: - Background Fetch

#if os(iOS) || os(tvOS)
  @objc
  public static func application(
    _ application: UIApplication,
    performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    let selector = #selector(application(_:performFetchWithCompletionHandler:))
    let subs = ExpoAppDelegateSubscriberRepository.subscribers.filter { $0.responds(to: selector) }
    var subscribersLeft = subs.count
    let dispatchQueue = DispatchQueue(label: "expo.application.performFetch", qos: .userInteractive)
    var failedCount = 0
    var newDataCount = 0

    let handler = { (result: UIBackgroundFetchResult) in
      dispatchQueue.sync {
        if result == .failed {
          failedCount += 1
        } else if result == .newData {
          newDataCount += 1
        }

        subscribersLeft -= 1

        if subscribersLeft == 0 {
          if newDataCount > 0 {
            completionHandler(.newData)
          } else if failedCount > 0 {
            completionHandler(.failed)
          } else {
            completionHandler(.noData)
          }
        }
      }
    }

    if subs.isEmpty {
      completionHandler(.noData)
    } else {
      subs.forEach { subscriber in
        subscriber.application?(application, performFetchWithCompletionHandler: handler)
      }
    }
  }

#endif

  // MARK: - Opening a URL-Specified Resource
#if os(iOS) || os(tvOS)

  @objc
  public static func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    return ExpoAppDelegateSubscriberRepository.subscribers.reduce(false) { result, subscriber in
      return subscriber.application?(app, open: url, options: options) ?? false || result
    }
  }
#elseif os(macOS)
  @objc
  public static func application(_ app: NSApplication, open urls: [URL]) {
    ExpoAppDelegateSubscriberRepository.subscribers.forEach { subscriber in
      subscriber.application?(app, open: urls)
    }
  }
#endif

#if os(iOS)

  /**
   * Sets allowed orientations for the application. It will use the values from `Info.plist`as the orientation mask unless a subscriber requested
   * a different orientation.
   */
  @objc
  public static func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    let deviceOrientationMask = allowedOrientations(for: UIDevice.current.userInterfaceIdiom)
    let universalOrientationMask = allowedOrientations(for: .unspecified)
    let infoPlistOrientations = deviceOrientationMask.isEmpty ? universalOrientationMask : deviceOrientationMask

    let parsedSubscribers = ExpoAppDelegateSubscriberRepository.subscribers.filter {
      $0.responds(to: #selector(application(_:supportedInterfaceOrientationsFor:)))
    }

    // We want to create an intersection of all orientations set by subscribers.
    let subscribersMask: UIInterfaceOrientationMask = parsedSubscribers.reduce(.all) { result, subscriber in
      guard let requestedOrientation = subscriber.application?(application, supportedInterfaceOrientationsFor: window) else {
        return result
      }
      return requestedOrientation.intersection(result)
    }
    return parsedSubscribers.isEmpty ? infoPlistOrientations : subscribersMask
  }
#endif
}

#if os(iOS)
private func allowedOrientations(for userInterfaceIdiom: UIUserInterfaceIdiom) -> UIInterfaceOrientationMask {
  // For now only iPad-specific orientations are supported
  let deviceString = userInterfaceIdiom == .pad ? "~pad" : ""
  var mask: UIInterfaceOrientationMask = []
  guard let orientations = Bundle.main.infoDictionary?["UISupportedInterfaceOrientations\(deviceString)"] as? [String] else {
    return mask
  }

  for orientation in orientations {
    switch orientation {
    case "UIInterfaceOrientationPortrait":
      mask.insert(.portrait)
    case "UIInterfaceOrientationLandscapeLeft":
      mask.insert(.landscapeLeft)
    case "UIInterfaceOrientationLandscapeRight":
      mask.insert(.landscapeRight)
    case "UIInterfaceOrientationPortraitUpsideDown":
      mask.insert(.portraitUpsideDown)
    default:
      break
    }
  }
  return mask
}
#endif // os(iOS)
