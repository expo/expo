public protocol ReactNativeFactoryProvider: AnyObject {
  /**
   To decouple RCTAppDelegate dependency from expo-modules-core,
   expo-modules-core doesn't include the concrete `RCTReactNativeFactory` type and let the callsite to include the type
   */
  associatedtype ReactNativeFactoryType
  var factory: ReactNativeFactoryType? { get }

  func recreateRootView(
    withBundleURL: URL?,
    moduleName: String?,
    initialProps: [AnyHashable: Any]?,
    launchOptions: [AnyHashable: Any]?
  ) -> UIView
}
