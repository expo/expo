// Copyright 2015-present 650 Industries. All rights reserved.

import Expo
import FirebaseCore

@UIApplicationMain
class AppDelegate: ExpoAppDelegate {
  var rootViewController: EXRootViewController?

  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
		self.moduleName = "main"
		self.initialProps = [:]

    // Tell `ExpoAppDelegate` to skip calling the React Native instance setup from `RCTAppDelegate`.
    self.automaticallyLoadReactNativeWindow = false

    FirebaseApp.configure()

    if application.applicationState != UIApplication.State.background {
      // App launched in foreground
      setUpUserInterfaceForApplication(application, withLaunchOptions: launchOptions)
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

	public override func bundleURL() -> URL? {
#if DEBUG
		return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
		return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
	}

  override func applicationWillEnterForeground(_ application: UIApplication) {
    setUpUserInterfaceForApplication(application, withLaunchOptions: nil)
    super.applicationWillEnterForeground(application)
  }

  private func setUpUserInterfaceForApplication(_ application: UIApplication, withLaunchOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) {
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
