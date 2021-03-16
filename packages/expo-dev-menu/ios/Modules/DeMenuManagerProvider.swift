// Copyright 2015-present 650 Industries. All rights reserved.

import EXDevMenuInterface

@objc(DevMenuManagerProvider)
class DevMenuManagerProvider : NSObject, RCTBridgeModule, DevMenuManagerProviderProtocol {
  @objc
  static func moduleName() -> String! {
    return "ExpoDevMenuManagerProvider"
  }
  
  @objc
  public static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc
  open func getDevMenuManager() -> DevMenuManagerProtocol {
    return DevMenuManager.shared
  }
}
