import React

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
