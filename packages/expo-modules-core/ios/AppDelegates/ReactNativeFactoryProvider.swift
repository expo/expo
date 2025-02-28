import React_RCTAppDelegate

public protocol ReactNativeFactoryProvider: AnyObject {
  var reactNativeFactory: RCTReactNativeFactory? { get }
  func recreateRootView(
    withBundleURL: URL?,
    moduleName: String?,
    initialProps: [AnyHashable: Any]?,
    launchOptions: [AnyHashable: Any]?
  ) -> UIView
}
