import UIKit

@UIApplicationMain
class AppDelegate: AppDelegateWrapper, RCTBridgeDelegate {
  var window: UIWindow?

  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    let bridge = reactDelegate.createBridge(delegate: self, launchOptions: launchOptions)!
    let rootView = reactDelegate.createRootView(bridge: bridge, moduleName: "HelloWorld", initialProperties: nil)

    if #available(iOS 13.0, *) {
      rootView.backgroundColor = UIColor.systemBackground
    } else {
      rootView.backgroundColor = UIColor.white
    }

    self.window = UIWindow(frame: UIScreen.main.bounds);
    let rootViewController = reactDelegate.createRootViewController()
    rootViewController.view = rootView
    self.window?.rootViewController = rootViewController
    self.window?.makeKeyAndVisible()
    super.application(application, didFinishLaunchingWithOptions: launchOptions)
    return true
  }

  func sourceURL(for bridge: RCTBridge!) -> URL! {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings()?.jsBundleURL(forBundleRoot: "index", fallbackResource: nil)
    #else
    return Bundle.main.url(forResource: "main", withExtension: "jsBundle")
    #endif
  }
}
