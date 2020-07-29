// Copyright 2015-present 650 Industries. All rights reserved.

@objc(DevMenuModule)
open class DevMenuModule: NSObject, RCTBridgeModule {
  public static func moduleName() -> String! {
    return "ExpoDevMenu"
  }

  public static func requiresMainQueueSetup() -> Bool {
    return true
  }

  // MARK: JavaScript API

  @objc
  func openMenu() {
    DevMenuManager.shared.openMenu()
  }
}
