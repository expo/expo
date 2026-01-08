internal import Expo
internal import React

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  /// Extension point for config-plugins
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // Needed to return the correct URL for expo-dev-client
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
      return RCTBundleURLProvider.sharedSettings().jsBundleURL(
        forBundleRoot: ".expo/.virtual-metro-entry")
    #else
      /// `main.jsbundle` isn't part of the main app bundle
      /// so we need to load it from the framework bundle
      let frameworkBundle = Bundle(for: ReactNativeHostManager.self)
      return frameworkBundle.url(forResource: "main", withExtension: "jsbundle")
    #endif
  }
}
