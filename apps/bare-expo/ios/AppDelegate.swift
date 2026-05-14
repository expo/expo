//internal import Expo
import Network
import React
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

//  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
//  var reactNativeFactory: RCTReactNativeFactory?

  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
//    let delegate = ReactNativeDelegate()
//    let factory = ExpoReactNativeFactory(delegate: delegate)
//    delegate.dependencyProvider = RCTAppDependencyProvider()

    // Fixes networking related crashes on simulator in iOS 26 beta 1
    nw_tls_create_options()

//    reactNativeDelegate = delegate
//    reactNativeFactory = factory

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
//    factory.startReactNative(
//      withModuleName: "main",
//      in: window,
//      launchOptions: launchOptions)
#endif

    return true//super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return false
//    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return result
//    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }
}

//class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
//  // Extension point for config-plugins
//
//  override func sourceURL(for bridge: RCTBridge) -> URL? {
//    // needed to return the correct URL for expo-dev-client.
//    bridge.bundleURL ?? bundleURL()
//  }
//
//  override func bundleURL() -> URL? {
//#if DEBUG
//    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
//#else
//    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
//#endif
//  }
//}
