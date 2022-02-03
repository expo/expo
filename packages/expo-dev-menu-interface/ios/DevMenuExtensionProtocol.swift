// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public protocol DevMenuExtensionSettingsProtocol {
  func wasRunOnDevelopmentBridge() -> Bool
}

/**
 A protocol for React Native bridge modules that want to provide their own dev menu actions.
 */
@objc
public protocol DevMenuExtensionProtocol {
  /**
   Returns a name of the module and the extension. Required by `RCTBridgeModule`.
   This function is optional because otherwise we end up with linker warning:
   `method '+moduleName' in category from /.../expo-dev-menu/libexpo-dev-menu.a(DevMenuExtensions-....o)
   overrides method from class in /.../expo-dev-menu/libexpo-dev-menu.a(DevMenuExtensions-....o`

   So we assume that this method will be implemented by `RCTBridgeModule`.
   In theory we can remove it. However, we leave it  to get easy access to the module name.
   */
  @objc
  optional static func moduleName() -> String!

  /**
   Returns an array of the dev menu items to show.
   It's called only once for the extension instance — results are being cached on first dev menu launch.
   */
  @objc
  optional func devMenuItems(_ settings: DevMenuExtensionSettingsProtocol) -> DevMenuItemsContainerProtocol?

  @objc
  optional func devMenuScreens(_ settings: DevMenuExtensionSettingsProtocol) -> [DevMenuScreen]?

  @objc
  optional func devMenuDataSources(_ settings: DevMenuExtensionSettingsProtocol) -> [DevMenuDataSourceProtocol]?
}
