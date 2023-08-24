// Copyright 2018-present 650 Industries. All rights reserved.

import ABI49_0_0React

/**
 The handler for `ExpoReactDelegate`. A module can implement a handler to process react instance creation.
 */
@objc(ABI49_0_0EXReactDelegateHandler)
open class ExpoReactDelegateHandler: NSObject {
  public override required init() {}

  /**
   If this module wants to handle `ABI49_0_0RCTBridge` creation, it can return the instance.
   Otherwise return nil.
   */
  @objc
  open func createBridge(reactDelegate: ExpoReactDelegate, bridgeDelegate: ABI49_0_0RCTBridgeDelegate, launchOptions: [AnyHashable: Any]?) -> ABI49_0_0RCTBridge? {
    return nil
  }

  /**
   If this module wants to handle `ABI49_0_0RCTRootView` creation, it can return the instance.
   Otherwise return nil.
   */
  @objc
  open func createRootView(reactDelegate: ExpoReactDelegate, bridge: ABI49_0_0RCTBridge, moduleName: String, initialProperties: [AnyHashable: Any]?) -> ABI49_0_0RCTRootView? {
    return nil
  }

  /**
   If this module wants to handle `UIViewController` creation for `ABI49_0_0RCTRootView`, it can return the instance.
   Otherwise return nil.
   */
  @objc
  open func createRootViewController(reactDelegate: ExpoReactDelegate) -> UIViewController? {
    return nil
  }

  // MARK: - event callbacks

  /**
   Callback before bridge creation
   */
  @objc
  open func bridgeWillCreate() {}

  /**
   Callback after bridge creation
   */
  @objc
  open func bridgeDidCreate(bridge: ABI49_0_0RCTBridge) {}
}
