// Copyright 2015-present 650 Industries. All rights reserved.

import Expo

@UIApplicationMain
class AppDelegate: ExpoAppDelegate {
  var rootViewController: EXRootViewController?

  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    ExpoGoReactNativeFeatureFlags.setup()

    // Tell `ExpoAppDelegate` to skip calling the React Native instance setup from `RCTAppDelegate`.
    self.shouldCallReactNativeSetup = false

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
    ExpoKit.sharedInstance().registerRootViewControllerClass(EXRootViewController.self)
    ExpoKit.sharedInstance().prepare(launchOptions: launchOptions)

    window = UIWindow(frame: UIScreen.main.bounds)
    window.backgroundColor = UIColor.white
    rootViewController = (ExpoKit.sharedInstance().rootViewController() as! EXRootViewController)
    window.rootViewController = rootViewController

    window.makeKeyAndVisible()
  }
}
