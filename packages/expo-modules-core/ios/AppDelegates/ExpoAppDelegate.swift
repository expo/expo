import UIKit
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

  // MARK: - Initializing the App

  open func application(_ application: UIApplication, willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    let parsedSubscribers = subscribers.filter {
      $0.responds(to: #selector(application(_:willFinishLaunchingWithOptions:)))
    }
    
    // If we can't find a subscriber that implements `willFinishLaunchingWithOptions`, we will delegate the decision if we can handel the passed URL to
    // the `didFinishLaunchingWithOptions` method by returning `true` here.
    //  You can read more about how iOS handles deep links here: https://developer.apple.com/documentation/uikit/uiapplicationdelegate/1623112-application#discussion
    if (parsedSubscribers.isEmpty) {
      return true;
    }
    
    return parsedSubscribers.reduce(false) { result, subscriber in
      return subscriber.application!(application, willFinishLaunchingWithOptions: launchOptions) || result
    }
  }

  open func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
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

    subs.forEach {
      $0.application?(application, handleEventsForBackgroundURLSession: identifier, completionHandler: handler)
    }
  }

  // MARK: - Handling Remote Notification Registration

  open func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    subscribers.forEach { $0.application?(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken) }
  }

  open func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    subscribers.forEach { $0.application?(application, didFailToRegisterForRemoteNotificationsWithError: error) }
  }

  open func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    let selector = #selector(application(_:didReceiveRemoteNotification:fetchCompletionHandler:))
    let subs = subscribers.filter { $0.responds(to: selector) }
    var subscribersLeft = subs.count
    var fetchResult: UIBackgroundFetchResult = .noData
    let dispatchQueue = DispatchQueue(label: "expo.application.remoteNotification", qos: .userInteractive)

    let handler = { (result: UIBackgroundFetchResult) in
      dispatchQueue.sync {
        if result == .failed {
          fetchResult = .failed
        } else if fetchResult != .failed && result == .newData {
          fetchResult = .newData
        }

        subscribersLeft -= 1

        if subscribersLeft == 0 {
          completionHandler(fetchResult)
        }
      }
    }

    subs.forEach { subscriber in
      subscriber.application?(application, didReceiveRemoteNotification: userInfo, fetchCompletionHandler: handler)
    }
  }

  // MARK: - Continuing User Activity and Handling Quick Actions

  open func application(_ application: UIApplication, willContinueUserActivityWithType userActivityType: String) -> Bool {
    return subscribers.reduce(false) { result, subscriber in
      return subscriber.application?(application, willContinueUserActivityWithType: userActivityType) ?? false || result
    }
  }

  open func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
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

    subs.forEach { subscriber in
      subscriber.application?(application, performActionFor: shortcutItem, completionHandler: handler)
    }
  }

  // MARK: - Background Fetch

  open func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    let selector = #selector(application(_:performFetchWithCompletionHandler:))
    let subs = subscribers.filter { $0.responds(to: selector) }
    var subscribersLeft = subs.count
    var fetchResult: UIBackgroundFetchResult = .noData
    let dispatchQueue = DispatchQueue(label: "expo.application.performFetch", qos: .userInteractive)

    let handler = { (result: UIBackgroundFetchResult) in
      dispatchQueue.sync {
        if result == .failed {
          fetchResult = .failed
        } else if fetchResult != .failed && result == .newData {
          fetchResult = .newData
        }

        subscribersLeft -= 1

        if subscribersLeft == 0 {
          completionHandler(fetchResult)
        }
      }
    }

    subs.forEach { subscriber in
      subscriber.application?(application, performFetchWithCompletionHandler: handler)
    }
  }

  // TODO: - Interacting With WatchKit

  // TODO: - Interacting With HealthKit

  // MARK: - Opening a URL-Specified Resource

  open func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    return subscribers.contains { subscriber in
      return subscriber.application?(app, open: url, options: options) ?? false
    }
  }

  // TODO: - Disallowing Specified App Extension Types

  // TODO: - Handling SiriKit Intents

  // TODO: - Handling CloudKit Invitations

  // TODO: - Managing Interface Geometry

  // MARK: - Statics

  @objc
  public static func registerSubscribersFrom(modulesProvider: ModulesProviderObjCProtocol) {
    guard let provider = modulesProvider as? ModulesProviderProtocol else {
      fatalError("Expo modules provider must implement `ModulesProviderProtocol`.")
    }
    provider.getAppDelegateSubscribers().forEach { subscriberType in
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

  @objc
  public static func registerReactDelegateHandlersFrom(modulesProvider: ModulesProviderObjCProtocol) {
    guard let provider = modulesProvider as? ModulesProviderProtocol else {
      fatalError("Expo modules provider must implement `ModulesProviderProtocol`.")
    }
    provider.getReactDelegateHandlers()
      .sorted { (tuple1, tuple2) -> Bool in
        return ModulePriorities.get(tuple1.packageName) > ModulePriorities.get(tuple2.packageName)
      }
      .forEach { handlerTuple in
        reactDelegateHandlers.append(handlerTuple.handler.init())
      }
  }
}
