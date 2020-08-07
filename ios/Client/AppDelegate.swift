// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@UIApplicationMain
class AppDelegate: UMAppDelegateWrapper {
  var rootViewController: EXRootViewController?

  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    if (application.applicationState != UIApplication.State.background) {
      // App launched in foreground
      setUpUserInterfaceForApplication(application, withLaunchOptions: launchOptions)
    }

    super.application(application, didFinishLaunchingWithOptions: launchOptions)

    // SplashScreen module registers SplashScreenView automatically for window.rootViewController (EXRootViewController),
    // and we want it to register for EXViewController (that is found in rootViewContrller view hierarchy),
    // so we need to hide it for window.rootViewController
    let splashScreenService: EXSplashScreenService = UMModuleRegistryProvider.getSingletonModule(for: EXSplashScreenService.self) as! EXSplashScreenService
    splashScreenService.hideSplashScreen(for: (window?.rootViewController)!,
                                         successCallback: { (success) in /* empty */ },
                                         failureCallback: { (message) in /* empty */ })
    return true
  }

  override func applicationWillEnterForeground(_ application: UIApplication) {
    setUpUserInterfaceForApplication(application, withLaunchOptions: nil)
    super.applicationWillEnterForeground(application)
  }

  private func setUpUserInterfaceForApplication(_ application: UIApplication, withLaunchOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]?) {
    if (self.window != nil) {
      return
    }

    ExpoKit.sharedInstance().registerRootViewControllerClass(EXRootViewController.self)
    ExpoKit.sharedInstance().prepare(launchOptions: launchOptions)

    window = UIWindow(frame: UIScreen.main.bounds)
    window!.backgroundColor = UIColor.white
    rootViewController = (ExpoKit.sharedInstance().rootViewController() as! EXRootViewController)
    window!.rootViewController = rootViewController

    window!.makeKeyAndVisible()
  }
}
