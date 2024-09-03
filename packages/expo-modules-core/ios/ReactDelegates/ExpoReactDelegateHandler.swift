// Copyright 2018-present 650 Industries. All rights reserved.

/**
 The handler for `ExpoReactDelegate`. A module can implement a handler to process react instance creation.
 */
@objc(EXReactDelegateHandler)
open class ExpoReactDelegateHandler: NSObject {
  public override required init() {}

  /**
   If this module wants to handle React instance and the root view creation, it can return the instance.
   Otherwise return nil.
   */
  #if os(iOS) || os(tvOS)
  @objc
  open func createReactRootView(
    reactDelegate: ExpoReactDelegate,
    moduleName: String,
    initialProperties: [AnyHashable: Any]?,
    launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> UIView? {
    return nil
  }
  #endif

  /**
   Clients could override this getter to serve the latest bundleURL for React instance.
   For example, expo-updates uses this to serve the newer bundleURL from `Updates.reloadAsync()`.
   */
  @objc
  open func bundleURL(reactDelegate: ExpoReactDelegate) -> URL? {
    return nil
  }

  /**
   If this module wants to handle `UIViewController` creation for `RCTRootView`, it can return the instance.
   Otherwise return nil.
   */
  @objc
  open func createRootViewController(reactDelegate: ExpoReactDelegate) -> UIViewController? {
    return nil
  }
}
