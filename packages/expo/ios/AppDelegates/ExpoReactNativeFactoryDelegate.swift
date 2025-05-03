import React_RCTAppDelegate

open class ExpoReactNativeFactoryDelegate: RCTDefaultReactNativeFactoryDelegate {
  open override func customize(_ rootView: UIView) {
    ExpoAppDelegateSubscriberRepository.subscribers.forEach { $0.customizeRootView?(rootView) }
  }
}
