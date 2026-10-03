internal import Expo
internal import React

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  private let turboModuleClasses: [String: AnyClass]
  init(
    turboModuleClasses: [String: AnyClass] = [:]
  ) {
    self.turboModuleClasses = turboModuleClasses
    super.init()
  }

  @objc(getModuleClassFromName:)
  func getModuleClass(fromName name: UnsafePointer<CChar>!) -> AnyClass? {
    let moduleName = String(cString: name)
    return turboModuleClasses[moduleName]
  }

  // Extension point for config-plugins
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // Needed to return the correct URL for expo-dev-client
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
    #if DEBUG
      // Compile-time `#if` keeps the Metro branch out of release binaries entirely; the runtime
      // check lets a debug build opt out of it and run against the embedded bundle instead.
      if ReactNativeHostManager.shared.useDevSupport {
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(
          forBundleRoot: ".expo/.virtual-metro-entry")
      }
    #endif

    return embeddedBundleURL()
  }

  /**
   * `main.jsbundle` isn't part of the main app bundle, so it has to be loaded from the framework
   * bundle — and we need to be sure it was actually packaged into the framework.
   */
  private func embeddedBundleURL() -> URL? {
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
      Cannot find `main.jsbundle` in the XCFramework bundle.
      React Native was started without dev support, so it loads JavaScript from the bundle
      embedded in the framework, but no bundle was packaged.
      In a debug build, enable the `ios.bundleInDebug` option on the expo-brownfield config
      plugin and rebuild. Otherwise initialize with `useDevSupport: true` to run against Metro.
      Available JS bundles:
      \(bundleList)
      """)
  }
}
