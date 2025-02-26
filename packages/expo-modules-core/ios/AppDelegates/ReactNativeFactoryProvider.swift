// TODO vonovak
// this is defined in EMC and currently used in Expo and in expo-dev-launcher

public protocol ReactNativeFactoryProvider: AnyObject {
  var reactNativeFactory: RCTReactNativeFactory? { get }
  func recreateRootView(
    withBundleURL: URL?,
    moduleName: String?,
    initialProps: [AnyHashable: Any]?,
    launchOptions: [AnyHashable: Any]?
  ) -> UIView
}
