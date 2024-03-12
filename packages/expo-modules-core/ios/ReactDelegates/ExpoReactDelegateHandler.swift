// Copyright 2018-present 650 Industries. All rights reserved.

/**
 The handler for `ExpoReactDelegate`. A module can implement a handler to process react instance creation.
 */
@objc(EXReactDelegateHandler)
open class ExpoReactDelegateHandler: NSObject {
  public override required init() {}

  /**
   If this module wants to handle react instance and the root view creation, it can return the instance.
   Otherwise return nil.
   */
  @objc
  open func createReactRootView(
    reactDelegate: ExpoReactDelegate,
    moduleName: String,
    initialProperties: [AnyHashable: Any]?,
    launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> UIView? {
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
