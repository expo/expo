internal import Expo
internal import React

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  private nonisolated let turboModuleClasses: [String: AnyClass]
  private let configuredBundleURL: URL

  init(turboModuleClasses: [String: AnyClass], bundleURL: URL) {
    self.turboModuleClasses = turboModuleClasses
    self.configuredBundleURL = bundleURL
    super.init()
  }

  @objc(getModuleClassFromName:)
  nonisolated func getModuleClass(fromName name: UnsafePointer<CChar>!) -> AnyClass? {
    turboModuleClasses[String(cString: name)]
  }

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
    configuredBundleURL
  }
}
