// Copyright 2015-present 650 Industries. All rights reserved.

import Expo
import React
import FirebaseCore
import ReactAppDependencyProvider


@UIApplicationMain
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
    bindReactNativeFactory(factory)

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
    ExpoKit.sharedInstance().prepare(launchOptions: launchOptions)

    let window = UIWindow(frame: UIScreen.main.bounds)
    self.window = window
    window.backgroundColor = UIColor.white
    rootViewController = (ExpoKit.sharedInstance().rootViewController() as! EXRootViewController)
    window.rootViewController = rootViewController

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
