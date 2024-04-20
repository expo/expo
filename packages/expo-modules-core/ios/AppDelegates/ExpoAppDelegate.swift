import Dispatch
import Foundation

var subscribers = [ExpoAppDelegateSubscriberProtocol]()
var reactDelegateHandlers = [ExpoReactDelegateHandler]()

/**
 Allows classes extending `ExpoAppDelegateSubscriber` to hook into project's app delegate
 by forwarding `UIApplicationDelegate` events to the subscribers.

 Keep functions and markers in sync with https://developer.apple.com/documentation/uikit/uiapplicationdelegate
 */
@objc(EXExpoAppDelegate)
open class ExpoAppDelegate: UIResponder, UIApplicationDelegate {
  open var window: UIWindow?

  @objc
  public let reactDelegate = ExpoReactDelegate(handlers: reactDelegateHandlers)

  #if os(iOS) || os(tvOS)
  // MARK: - Initializing the App

  open func application(_ application: UIApplication, willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    let parsedSubscribers = subscribers.filter {
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

  open func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    return subscribers.reduce(false) { result, subscriber in
      return subscriber.application?(application, didFinishLaunchingWithOptions: launchOptions) ?? false || result
    }
  }

  // TODO: - Configuring and Discarding Scenes

  // MARK: - Responding to App Life-Cycle Events

  @objc
  open func applicationDidBecomeActive(_ application: UIApplication) {
    subscribers.forEach { $0.applicationDidBecomeActive?(application) }
  }

  @objc
  open func applicationWillResignActive(_ application: UIApplication) {
    subscribers.forEach { $0.applicationWillResignActive?(application) }
  }

  @objc
  open func applicationDidEnterBackground(_ application: UIApplication) {
    subscribers.forEach { $0.applicationDidEnterBackground?(application) }
  }

  open func applicationWillEnterForeground(_ application: UIApplication) {
    subscribers.forEach { $0.applicationWillEnterForeground?(application) }
  }

  open func applicationWillTerminate(_ application: UIApplication) {
    subscribers.forEach { $0.applicationWillTerminate?(application) }
  }

  // TODO: - Responding to Environment Changes

  // TODO: - Managing App State Restoration

  // MARK: - Downloading Data in the Background

  open func application(_ application: UIApplication, handleEventsForBackgroundURLSession identifier: String, completionHandler: @escaping () -> Void) {
    let selector = #selector(application(_:handleEventsForBackgroundURLSession:completionHandler:))
    let subs = subscribers.filter { $0.responds(to: selector) }
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

  // MARK: - Handling Remote Notification Registration

  open func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    subscribers.forEach { $0.application?(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken) }
  }

  open func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    subscribers.forEach { $0.application?(application, didFailToRegisterForRemoteNotificationsWithError: error) }
  }

  open func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    let selector = #selector(application(_:didReceiveRemoteNotification:fetchCompletionHandler:))
    let subs = subscribers.filter { $0.responds(to: selector) }
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

  // MARK: - Continuing User Activity and Handling Quick Actions

  open func application(_ application: UIApplication, willContinueUserActivityWithType userActivityType: String) -> Bool {
    return subscribers.reduce(false) { result, subscriber in
      return subscriber.application?(application, willContinueUserActivityWithType: userActivityType) ?? false || result
    }
  }

  open func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let selector = #selector(application(_:continue:restorationHandler:))
    let subs = subscribers.filter { $0.responds(to: selector) }
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

  open func application(_ application: UIApplication, didUpdate userActivity: NSUserActivity) {
    return subscribers.forEach { $0.application?(application, didUpdate: userActivity) }
  }

  open func application(_ application: UIApplication, didFailToContinueUserActivityWithType userActivityType: String, error: Error) {
    return subscribers.forEach {
      $0.application?(application, didFailToContinueUserActivityWithType: userActivityType, error: error)
    }
  }

#if !os(tvOS)
  open func application(_ application: UIApplication, performActionFor shortcutItem: UIApplicationShortcutItem, completionHandler: @escaping (Bool) -> Void) {
    let selector = #selector(application(_:performActionFor:completionHandler:))
    let subs = subscribers.filter { $0.responds(to: selector) }
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

  open func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    let selector = #selector(application(_:performFetchWithCompletionHandler:))
    let subs = subscribers.filter { $0.responds(to: selector) }
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

  // TODO: - Interacting With WatchKit

  // TODO: - Interacting With HealthKit

  // MARK: - Opening a URL-Specified Resource

  open func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    return subscribers.contains { subscriber in
      return subscriber.application?(app, open: url, options: options) ?? false
    }
  }

  // TODO: - Disallowing Specified App Extension Types

  // TODO: - Handling SiriKit Intents

  // TODO: - Handling CloudKit Invitations

  // MARK: - Managing Interface Geometry

  /**
   * Sets allowed orientations for the application. It will use the values from `Info.plist`as the orientation mask unless a subscriber requested
   * a different orientation.
   */
#if !os(tvOS)
  public func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    let deviceOrientationMask = allowedOrientations(for: UIDevice.current.userInterfaceIdiom)
    let universalOrientationMask = allowedOrientations(for: .unspecified)
    let infoPlistOrientations = deviceOrientationMask.isEmpty ? universalOrientationMask : deviceOrientationMask

    let parsedSubscribers = subscribers.filter {
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

  #endif // os(iOS)

  // MARK: - Statics

  @objc
  public static func registerSubscribersFrom(modulesProvider: ModulesProvider) {
    modulesProvider.getAppDelegateSubscribers().forEach { subscriberType in
      registerSubscriber(subscriberType.init())
    }
  }

  @objc
  public static func registerSubscriber(_ subscriber: ExpoAppDelegateSubscriberProtocol) {
    if subscribers.contains(where: { $0 === subscriber }) {
      fatalError("Given app delegate subscriber `\(String(describing: subscriber))` is already registered.")
    }
    subscribers.append(subscriber)
  }

  @objc
  public static func getSubscriber(_ name: String) -> ExpoAppDelegateSubscriberProtocol? {
    return subscribers.first { String(describing: $0) == name }
  }

  public static func getSubscriberOfType<Subscriber>(_ type: Subscriber.Type) -> Subscriber? {
    return subscribers.first { $0 is Subscriber } as? Subscriber
  }

  @objc
  public static func registerReactDelegateHandlersFrom(modulesProvider: ModulesProvider) {
    modulesProvider.getReactDelegateHandlers()
      .sorted { tuple1, tuple2 -> Bool in
        return ModulePriorities.get(tuple1.packageName) > ModulePriorities.get(tuple2.packageName)
      }
      .forEach { handlerTuple in
        reactDelegateHandlers.append(handlerTuple.handler.init())
      }
  }
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
