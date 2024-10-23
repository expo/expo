// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

@UIApplicationMain
class AppDelegate: ExpoAppDelegate {
  var rootViewController: EXRootViewController?

  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
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

    window = UIWindow(frame: UIScreen.main.bounds)
    window?.backgroundColor = UIColor.white
    rootViewController = (ExpoKit.sharedInstance().rootViewController() as! EXRootViewController)
    window?.rootViewController = rootViewController

    window?.makeKeyAndVisible()
  }

  override func applicationDidBecomeActive(_ application: UIApplication) {
    super.applicationDidBecomeActive(application)
    Task {
      do {
        try await requestLocalNetworkAuthorization()
      } catch {
        log.error(error)
      }
    }
  }
}
