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
      .first(where: { _ in true }) ?? ExpoRootViewController()
  }
}

/**
 Returns the status bar values that JavaScript sets, like React Native's default root view controller.
 The `UIApplication` status bar setters do nothing in apps built with the iOS 27 SDK.
 */
final class ExpoRootViewController: UIViewController {
  override var preferredStatusBarStyle: UIStatusBarStyle { RCTStatusBarAppearance.style }
  override var prefersStatusBarHidden: Bool { RCTStatusBarAppearance.hidden }
  override var preferredStatusBarUpdateAnimation: UIStatusBarAnimation { RCTStatusBarAppearance.updateAnimation }
}

/**
 Makes `ExpoReactDelegate.createRootViewController()` return `ExpoRootViewController` when no other handler provides a view controller.
 */
final class ExpoRootViewControllerReactDelegateHandler: ExpoReactDelegateHandler {
  override func createRootViewController() -> UIViewController? {
    return ExpoRootViewController()
  }
}
