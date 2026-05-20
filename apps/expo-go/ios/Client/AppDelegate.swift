// Copyright 2015-present 650 Industries. All rights reserved.

import Expo
import React
import FirebaseCore
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate {
  var rootViewController: EXRootViewController?
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoGoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    FirebaseApp.configure()

    if application.applicationState != UIApplication.State.background {
      // App launched in foreground
      setUpUserInterfaceForApplication(application, withLaunchOptions: launchOptions)
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func applicationWillEnterForeground(_ application: UIApplication) {
    setUpUserInterfaceForApplication(application, withLaunchOptions: nil)
    super.applicationWillEnterForeground(application)
  }

  private func setUpUserInterfaceForApplication(_ application: UIApplication, withLaunchOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
    if self.window != nil {
      return
    }
    ExpoKit.sharedInstance().registerRootViewControllerClass(EXRootViewController.self)
    ExpoKit.sharedInstance().prepare()

    let window = UIWindow(frame: UIScreen.main.bounds)
    self.window = window
    window.backgroundColor = UIColor.white
    rootViewController = (ExpoKit.sharedInstance().rootViewController() as! EXRootViewController)
    window.rootViewController = rootViewController
    if let initialURL = EXKernelLinkingManager.initialUrl(fromLaunchOptions: launchOptions) {
      // When the app is cold-launched via a URL scheme (e.g. exp://), iOS delivers the URL
      // in two ways: (1) here in launchOptions, and (2) by calling application:openURL:options:
      // after this method returns. If we handle it in both places, two RCTHost instances are
      // created concurrently, which crashes on first install due to a Swift runtime metadata
      // race condition. So we skip URL scheme deep links here and let openURL be the sole handler.
      // Non-URL-scheme sources (process args via --initialUrl, universal links) don't have a
      // separate callback, so we still handle those here.
      let isURLSchemeDeepLink = (launchOptions?[.url] as? URL) == initialURL
      if !isURLSchemeDeepLink {
        rootViewController?.setInitialHomeURL(initialURL)
      }
    }

    window.makeKeyAndVisible()
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
