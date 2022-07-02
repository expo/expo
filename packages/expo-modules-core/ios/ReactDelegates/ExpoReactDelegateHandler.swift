// Copyright 2018-present 650 Industries. All rights reserved.

import React

/**
 The handler for `ExpoReactDelegate`. A module can implement a handler to process react instance creation.
 */
@objc
open class ExpoReactDelegateHandler: NSObject {
  public override required init() {}

  /**
   If this module wants to handle `RCTBridge` creation, it can return the instance.
   Otherwise return nil.
   */
  @objc
  open func createBridge(reactDelegate: ExpoReactDelegate, bridgeDelegate: RCTBridgeDelegate, launchOptions: [AnyHashable: Any]?) -> RCTBridge? {
    return nil
  }

  /**
   If this module wants to handle `RCTRootView` creation, it can return the instance.
   Otherwise return nil.
   */
  @objc
  open func createRootView(reactDelegate: ExpoReactDelegate, bridge: RCTBridge, moduleName: String, initialProperties: [AnyHashable: Any]?) -> RCTRootView? {
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
  open func bridgeDidCreate(bridge: RCTBridge) {}
}
