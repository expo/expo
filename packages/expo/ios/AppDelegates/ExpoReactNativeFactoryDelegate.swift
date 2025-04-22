import React_RCTAppDelegate

@objc(EXExpoReactNativeFactoryDelegate)
open class ExpoReactNativeFactoryDelegate: RCTDefaultReactNativeFactoryDelegate {
  open override func customize(_ rootView: UIView) {
    ExpoAppDelegateSubscriberRepository.subscribers.forEach { $0.customizeRootView?(rootView) }
  }

  open override func sourceURL(for bridge: RCTBridge) -> URL? {
    bridge.bundleURL ?? bundleURL()
  }

  open override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
