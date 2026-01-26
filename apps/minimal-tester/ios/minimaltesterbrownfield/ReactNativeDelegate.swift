@_implementationOnly import Expo
@_implementationOnly import React

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // Needed to return the correct URL for expo-dev-client
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
      return RCTBundleURLProvider.sharedSettings().jsBundleURL(
        forBundleRoot: ".expo/.virtual-metro-entry")
    #else
      // `main.jsbundle` isn't part of the main app bundle
      // so we need to load it from the framework bundle
      // and ensure that it's present in the framework
      let frameworkBundle = Bundle(for: ReactNativeHostManager.self)
      if let bundleURL = frameworkBundle.url(forResource: "main", withExtension: "jsbundle") {
        return bundleURL
      }

      let availableBundles =
        frameworkBundle.urls(forResourcesWithExtension: "jsbundle", subdirectory: nil)
        ?? []
      let bundleList =
        availableBundles.isEmpty
        ? "None"
        : availableBundles.map { "- \($0.lastPathComponent)" }.joined(separator: "\n")

      fatalError(
        """
        Cannot find `main.jsbundle` in the XCFramework bundle
        Available JS bundles:
        \(bundleList)
        """)
    #endif
  }
}
