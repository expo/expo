import Foundation

@UIApplicationMain
class AppDelegate: UMAppDelegateWrapper, RCTBridgeDelegate, EXUpdatesAppControllerDelegate {
  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  var moduleRegistryAdapter: UMModuleRegistryAdapter!
  
  override func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    
    self.launchOptions = launchOptions
    moduleRegistryAdapter = UMModuleRegistryAdapter(moduleRegistryProvider: UMModuleRegistryProvider())
    window = UIWindow(frame: UIScreen.main.bounds)

    #if DEBUG
    initializeReactNativeApp()
    #else
    let controller = EXUpdatesAppController.sharedInstance()
    controller.delegate = self
    controller.startAndShowLaunchScreen(window!)
    #endif

    super.application(application, didFinishLaunchingWithOptions: launchOptions)
    
    return true
  }
  
  @discardableResult
  func initializeReactNativeApp() -> RCTBridge? {
    guard let bridge = RCTBridge(delegate: self, launchOptions: launchOptions) else { return nil }
    let rootView = RCTRootView(bridge: bridge, moduleName: "main", initialProperties: nil)
    let rootViewController = UIViewController()
    
    rootView.backgroundColor = UIColor.white
    rootViewController.view = rootView
    window?.rootViewController = rootViewController
    window?.makeKeyAndVisible()
    
    return bridge
  }

  func appController(_ appController: EXUpdatesAppController, didStartWithSuccess success: Bool) {
    appController.bridge = initializeReactNativeApp()
  }
  
  func sourceURL(for bridge: RCTBridge!) -> URL! {
    #if DEBUG
    return RCTBundleURLProvider.sharedSettings()?.jsBundleURL(forBundleRoot: "index", fallbackResource: nil)
    #else
    return EXUpdatesAppController.sharedInstance().launchAssetUrl!
    #endif
  }
  
  func extraModules(for bridge: RCTBridge!) -> [RCTBridgeModule]! {
    let extraModules = moduleRegistryAdapter.extraModules(for: bridge)
    // You can inject any extra modules that you would like here, more information at:
    // https://facebook.github.io/react-native/docs/native-modules-ios.html#dependency-injection
    return extraModules
  }
}
