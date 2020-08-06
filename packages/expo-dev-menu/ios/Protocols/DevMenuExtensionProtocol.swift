// Copyright 2015-present 650 Industries. All rights reserved.

/**
 A protocol for React Native bridge modules that want to provide their own dev menu actions.
 */
@objc
public protocol DevMenuExtensionProtocol {
  /**
   Returns a name of the module and the extension. Also required by `RCTBridgeModule`.
   */
  @objc
  static func moduleName() -> String!

  /**
   Returns an array of the dev menu items to show.
   It's called only once for the extension instance — results are being cached on first dev menu launch.
   */
  @objc
  optional func devMenuItems() -> [DevMenuItem]?
}
