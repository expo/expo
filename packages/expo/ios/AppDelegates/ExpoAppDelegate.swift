import Dispatch
import Foundation
import ExpoModulesCore

/**
 Note: you cannot subclass Swift from Objective-C, use EXAppDelegateWrapper with Obj-C app delegates
 Allows classes extending `ExpoAppDelegateSubscriber` to hook into project's app delegate
 by forwarding `UIApplicationDelegate` events to the subscribers.

 Keep functions and markers in sync with https://developer.apple.com/documentation/uikit/uiapplicationdelegate

 TODO vonovak check macOS support once RN macOS 78 goes out
 */
@objc(EXExpoAppDelegate)
open class ExpoAppDelegate: ExpoReactNativeFactoryDelegate, UIApplicationDelegate, UISceneDelegate {
  /// The window object, used to render the UIViewControllers
  public var window: UIWindow?

  /// From RCTAppDelegate
  @objc public var moduleName: String = ""
  @objc public var initialProps: [AnyHashable: Any]?

  @objc public let reactDelegate = ExpoReactDelegate(
    handlers: ExpoAppDelegateSubscriberRepository.reactDelegateHandlers
  )

  /// If `automaticallyLoadReactNativeWindow` is set to `true`, the React Native window will be loaded automatically.
  private var automaticallyLoadReactNativeWindow = true

  // Default initializer
  public override init() {
    super.init()
    self.reactNativeFactory = ExpoReactNativeFactory(delegate: self, reactDelegate: self.reactDelegate)
  }

  func loadReactNativeWindow(launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
    guard let reactNativeFactory = self.reactNativeFactory else {
      fatalError("loadReactNativeWindow: Missing reactNativeFactory in ExpoAppInstance")
    }
    let rootView = reactNativeFactory.rootViewFactory.view(
      withModuleName: self.moduleName as String,
      initialProperties: self.initialProps,
      launchOptions: launchOptions
    )

    let window = UIWindow(frame: UIScreen.main.bounds)
    let rootViewController = createRootViewController()

    setRootView(rootView, toRootViewController: rootViewController)

    window.windowScene?.delegate = self
    window.rootViewController = rootViewController
    window.makeKeyAndVisible()

    self.window = window
  }

  @objc
  open override func createRootViewController() -> UIViewController {
    return reactDelegate.createRootViewController()
  }

  @objc public override func recreateRootView(
    withBundleURL: URL?,
    moduleName: String?,
    initialProps: [AnyHashable: Any]?,
    launchOptions: [AnyHashable: Any]?
  ) -> UIView {
    guard let reactNativeFactory = self.reactNativeFactory else {
      fatalError("recreateRootView: Missing reactNativeFactory in ExpoAppInstance")
    }

    let rootViewFactory = reactNativeFactory.rootViewFactory

    if self.newArchEnabled() {
      // chrfalch: rootViewFactory.reactHost is not available here in swift due to the underlying RCTHost type of the property. (todo: check)
      assert(rootViewFactory.value(forKey: "reactHost") == nil, "recreateRootViewWithBundleURL: does not support when react instance is created")
    } else {
      assert(rootViewFactory.bridge == nil, "recreateRootViewWithBundleURL: does not support when react instance is created")
    }

    let configuration = rootViewFactory.value(forKey: "_configuration") as? RCTRootViewFactoryConfiguration

    if let bundleURL = withBundleURL {
      configuration?.bundleURLBlock = {
        return bundleURL
      }
    }

    if let moduleName = moduleName {
      self.moduleName = moduleName
    }

    if let initialProps = initialProps {
      self.initialProps = initialProps
    }

    let rootView: UIView
    if let factory = rootViewFactory as? ExpoReactRootViewFactory {
      // When calling `recreateRootViewWithBundleURL:` from `EXReactRootViewFactory`,
      // we don't want to loop the ReactDelegate again. Otherwise, it will be an infinite loop.
      rootView = factory.superView(
        withModuleName: self.moduleName as String,
        initialProperties: self.initialProps ?? [:],
        launchOptions: launchOptions ?? [:]
      )
    } else {
      rootView = rootViewFactory.view(
        withModuleName: self.moduleName as String,
        initialProperties: self.initialProps,
        launchOptions: launchOptions
      )
    }

    return rootView
  }

  open override func sourceURL(for bridge: RCTBridge) -> URL? {
    // This method is called only in the old architecture. For compatibility just use the result of a new `bundleURL` method.
    return bundleURL()
  }

  // MARK: - Initializing the App
#if os(iOS) || os(tvOS)

  open func application(
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

  open func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    if automaticallyLoadReactNativeWindow {
      loadReactNativeWindow(launchOptions: launchOptions)
    }

    ExpoAppDelegateSubscriberRepository.subscribers.forEach { subscriber in
      // Subscriber result is ignored as it doesn't matter if any subscriber handled the incoming URL – we always return `true` anyway.
      _ = subscriber.application?(application, didFinishLaunchingWithOptions: launchOptions)
    }

    return true
  }

#elseif os(macOS)
  open override func applicationWillFinishLaunching(_ notification: Notification) {
    let parsedSubscribers = ExpoAppDelegateSubscriberRepository.subscribers.filter {
      $0.responds(to: #selector(applicationWillFinishLaunching(_:)))
    }

    parsedSubscribers.forEach { subscriber in
      subscriber.applicationWillFinishLaunching?(notification)
    }
  }

  open override func applicationDidFinishLaunching(_ notification: Notification) {
    if shouldCallReactNativeSetup {
      super.applicationDidFinishLaunching(notification)
    }

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
  open func applicationDidBecomeActive(_ application: UIApplication) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationDidBecomeActive?(application) }
  }

  @objc
  open func applicationWillResignActive(_ application: UIApplication) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationWillResignActive?(application) }
  }

  @objc
  open func applicationDidEnterBackground(_ application: UIApplication) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationDidEnterBackground?(application) }
  }

  open func applicationWillEnterForeground(_ application: UIApplication) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationWillEnterForeground?(application) }
  }

  open func applicationWillTerminate(_ application: UIApplication) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationWillTerminate?(application) }
  }

#elseif os(macOS)
  @objc
  open override func applicationDidBecomeActive(_ notification: Notification) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationDidBecomeActive?(notification) }
  }

  @objc
  open override func applicationWillResignActive(_ notification: Notification) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationWillResignActive?(notification) }
  }

  @objc
  open override func applicationDidHide(_ notification: Notification) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationDidHide?(notification) }
  }

  open override func applicationWillUnhide(_ notification: Notification) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationWillUnhide?(notification) }
  }

  open override func applicationWillTerminate(_ notification: Notification) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.applicationWillTerminate?(notification) }
  }
#endif

  // TODO: - Responding to Environment Changes

  // TODO: - Managing App State Restoration

  // MARK: - Downloading Data in the Background

#if os(iOS) || os(tvOS)
  open func application(
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

  open func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.application?(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken) }
  }

  open func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
    ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.application?(application, didFailToRegisterForRemoteNotificationsWithError: error) }
  }

#if os(iOS) || os(tvOS)
  open func application(
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
  open override func application(
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

  open func application(_ application: UIApplication, willContinueUserActivityWithType userActivityType: String) -> Bool {
    return ExpoAppDelegateSubscriberRepository
      .subscribers
      .reduce(false) { result, subscriber in
        return subscriber.application?(application, willContinueUserActivityWithType: userActivityType) ?? false || result
      }
  }

#if os(iOS) || os(tvOS)
  open func application(
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
  open override func application(
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

  open func application(_ application: UIApplication, didUpdate userActivity: NSUserActivity) {
    return ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach { $0.application?(application, didUpdate: userActivity) }
  }

  open func application(_ application: UIApplication, didFailToContinueUserActivityWithType userActivityType: String, error: Error) {
    return ExpoAppDelegateSubscriberRepository
      .subscribers
      .forEach {
        $0.application?(application, didFailToContinueUserActivityWithType: userActivityType, error: error)
      }
  }

#if os(iOS)
  open func application(
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
  open func application(
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

  // TODO: - Interacting With WatchKit

  // TODO: - Interacting With HealthKit
#endif

  // MARK: - Opening a URL-Specified Resource
#if os(iOS) || os(tvOS)

  open func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    return ExpoAppDelegateSubscriberRepository.subscribers.reduce(false) { result, subscriber in
      return subscriber.application?(app, open: url, options: options) ?? false || result
    }
  }
#elseif os(macOS)
  open override func application(_ app: NSApplication, open urls: [URL]) {
    ExpoAppDelegateSubscriberRepository.subscribers.forEach { subscriber in
      subscriber.application?(app, open: urls)
    }
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

  // MARK: - ExpoAppDelegateSubscriberProtocol

  @objc
  open override func customize(_ rootView: RCTRootView) {
    ExpoAppDelegateSubscriberRepository.subscribers.forEach { $0.customizeRootView?(rootView) }
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
