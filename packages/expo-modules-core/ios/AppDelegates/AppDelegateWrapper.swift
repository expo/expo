import UIKit
import Dispatch
import Foundation

var subcontractors = [AppDelegateSubcontractorProtocol]()

@objc(EXAppDelegateWrapper)
open class AppDelegateWrapper: UIResponder, UIApplicationDelegate {
  open var window: UIWindow?

  // MARK: - Initializing the App

  open func application(_ application: UIApplication, willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    return subcontractors.reduce(false) { result, subcontractor in
      return subcontractor.application?(application, willFinishLaunchingWithOptions: launchOptions) ?? false || result
    }
  }

  open func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    return subcontractors.reduce(false) { result, subcontractor in
      return subcontractor.application?(application, didFinishLaunchingWithOptions: launchOptions) ?? false || result
    }
  }

  // TODO: - Configuring and Discarding Scenes

  // MARK: - Responding to App Life-Cycle Events

  open func applicationDidBecomeActive(_ application: UIApplication) {
    subcontractors.forEach { $0.applicationDidBecomeActive?(application) }
  }

  open func applicationWillResignActive(_ application: UIApplication) {
    subcontractors.forEach { $0.applicationWillResignActive?(application) }
  }

  open func applicationDidEnterBackground(_ application: UIApplication) {
    subcontractors.forEach { $0.applicationDidEnterBackground?(application) }
  }

  open func applicationWillEnterForeground(_ application: UIApplication) {
    subcontractors.forEach { $0.applicationWillEnterForeground?(application) }
  }

  open func applicationWillTerminate(_ application: UIApplication) {
    subcontractors.forEach { $0.applicationWillTerminate?(application) }
  }

  // TODO: - Responding to Environment Changes

  // TODO: - Managing App State Restoration

  // MARK: - Downloading Data in the Background

  open func application(_ application: UIApplication, handleEventsForBackgroundURLSession identifier: String, completionHandler: @escaping () -> Void) {
    let selector = #selector(application(_:handleEventsForBackgroundURLSession:completionHandler:))
    let subs = subcontractors.filter { $0.responds(to: selector) }
    var subcontractorsLeft = subs.count
    let dispatchQueue = DispatchQueue(label: "expo.application.handleBackgroundEvents")

    let handler = {
      dispatchQueue.sync {
        subcontractorsLeft -= 1

        if subcontractorsLeft == 0 {
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
    subcontractors.forEach { $0.application?(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken) }
  }

  open func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    subcontractors.forEach { $0.application?(application, didFailToRegisterForRemoteNotificationsWithError: error) }
  }

  open func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable : Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    let selector = #selector(application(_:didReceiveRemoteNotification:fetchCompletionHandler:))
    let subs = subcontractors.filter { $0.responds(to: selector) }
    var subcontractorsLeft = subs.count
    var fetchResult: UIBackgroundFetchResult = .noData
    let dispatchQueue = DispatchQueue(label: "expo.application.remoteNotification", qos: .userInteractive)

    let handler = { (result: UIBackgroundFetchResult) in
      dispatchQueue.sync {
        if result == .failed {
          fetchResult = .failed
        } else if fetchResult != .failed && result == .newData {
          fetchResult = .newData
        }

        subcontractorsLeft -= 1

        if subcontractorsLeft == 0 {
          completionHandler(fetchResult)
        }
      }
    }

    subs.forEach { subcontractor in
      subcontractor.application?(application, didReceiveRemoteNotification: userInfo, fetchCompletionHandler: handler)
    }
  }

  // MARK: - Continuing User Activity and Handling Quick Actions

  open func application(_ application: UIApplication, willContinueUserActivityWithType userActivityType: String) -> Bool {
    return subcontractors.reduce(false) { result, subcontractor in
      return subcontractor.application?(application, willContinueUserActivityWithType: userActivityType) ?? false || result
    }
  }

  open func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    let selector = #selector(application(_:continue:restorationHandler:))
    let subs = subcontractors.filter { $0.responds(to: selector) }
    var subcontractorsLeft = subs.count
    let dispatchQueue = DispatchQueue(label: "expo.application.continueUserActivity", qos: .userInteractive)
    var allRestorableObjects = [UIUserActivityRestoring]()

    let handler = { (restorableObjects: [UIUserActivityRestoring]?) in
      dispatchQueue.sync {
        if let restorableObjects = restorableObjects {
          allRestorableObjects.append(contentsOf: restorableObjects)
        }

        subcontractorsLeft -= 1

        if subcontractorsLeft == 0 {
          restorationHandler(allRestorableObjects)
        }
      }
    }

    return subcontractors.reduce(false) { result, subcontractor in
      return subcontractor.application?(application, continue: userActivity, restorationHandler: handler) ?? false || result
    }
  }

  open func application(_ application: UIApplication, didUpdate userActivity: NSUserActivity) {
    return subcontractors.forEach { $0.application?(application, didUpdate: userActivity) }
  }

  open func application(_ application: UIApplication, didFailToContinueUserActivityWithType userActivityType: String, error: Error) {
    return subcontractors.forEach {
      $0.application?(application, didFailToContinueUserActivityWithType: userActivityType, error: error)
    }
  }

  open func application(_ application: UIApplication, performActionFor shortcutItem: UIApplicationShortcutItem, completionHandler: @escaping (Bool) -> Void) {
    let selector = #selector(application(_:performActionFor:completionHandler:))
    let subs = subcontractors.filter { $0.responds(to: selector) }
    var subcontractorsLeft = subs.count
    var result: Bool = false
    let dispatchQueue = DispatchQueue(label: "expo.application.performAction", qos: .userInteractive)

    let handler = { (succeeded: Bool) in
      dispatchQueue.sync {
        result = result || succeeded
        subcontractorsLeft -= 1

        if subcontractorsLeft == 0 {
          completionHandler(result)
        }
      }
    }

    subs.forEach { subcontractor in
      subcontractor.application?(application, performActionFor: shortcutItem, completionHandler: handler)
    }
  }

  // MARK: - Background Fetch

  open func application(_ application: UIApplication, performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
    let selector = #selector(application(_:performFetchWithCompletionHandler:))
    let subs = subcontractors.filter { $0.responds(to: selector) }
    var subcontractorsLeft = subs.count
    var fetchResult: UIBackgroundFetchResult = .noData
    let dispatchQueue = DispatchQueue(label: "expo.application.performFetch", qos: .userInteractive)

    let handler = { (result: UIBackgroundFetchResult) in
      dispatchQueue.sync {
        if result == .failed {
          fetchResult = .failed
        } else if fetchResult != .failed && result == .newData {
          fetchResult = .newData
        }

        subcontractorsLeft -= 1

        if subcontractorsLeft == 0 {
          completionHandler(fetchResult)
        }
      }
    }

    subs.forEach { subcontractor in
      subcontractor.application?(application, performFetchWithCompletionHandler: handler)
    }
  }

  // TODO: - Interacting With WatchKit

  // TODO: - Interacting With HealthKit

  // MARK: - Opening a URL-Specified Resource

  open func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    return subcontractors.contains { subcontractor in
      return subcontractor.application?(app, open: url, options: options) ?? false
    }
  }

  // TODO: - Disallowing Specified App Extension Types

  // TODO: - Handling SiriKit Intents

  // TODO: - Handling CloudKit Invitations

  // TODO: - Managing Interface Geometry

  // MARK: - Statics

  @objc
  public static func registerSubcontractorsFrom(modulesProvider: ModulesProviderObjCProtocol) {
    guard let provider = modulesProvider as? ModulesProviderProtocol else {
      fatalError("Expo modules provider must implement `ModulesProviderProtocol`.")
    }
    provider.getAppDelegateSubcontractors().forEach { subcontractorType in
      registerSubcontractor(subcontractorType.init())
    }
  }

  @objc
  public static func registerSubcontractor(_ subcontractor: AppDelegateSubcontractorProtocol) {
    if subcontractors.contains(where: { $0 === subcontractor }) {
      fatalError("Given app delegate subcontractor `\(String(describing: subcontractor))` is already registered.")
    }
    subcontractors.append(subcontractor)
  }

  @objc
  public static func getSubcontractor(_ name: String) -> AppDelegateSubcontractorProtocol? {
    return subcontractors.first { String(describing: $0) == name }
  }
}
