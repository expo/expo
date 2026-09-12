import React
// SwiftPM compiles Expo and ExpoObjC as separate modules; CocoaPods builds them
// as one pod target where Swift saw the ObjC half implicitly.
#if canImport(ExpoObjC)
import ExpoObjC
#endif

open class ExpoReactNativeFactoryDelegate: RCTDefaultReactNativeFactoryDelegate {
  open override func customize(_ rootView: UIView) {
    ExpoAppDelegateSubscriberRepository.subscribers.forEach { $0.customizeRootView?(rootView) }
  }

  open override func createRootViewController() -> UIViewController {
    return ExpoAppDelegateSubscriberRepository.reactDelegateHandlers.lazy
      .compactMap { $0.createRootViewController() }
      .first(where: { _ in true }) ?? UIViewController()
  }
}
