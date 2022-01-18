// Copyright 2015-present 650 Industries. All rights reserved.

import EXDevMenuInterface

@objc(DevMenuManagerProvider)
class DevMenuManagerProvider: NSObject, DevMenuManagerProviderProtocol {
  @objc
  open func getDevMenuManager() -> DevMenuManagerProtocol {
    return DevMenuManager.shared
  }
}
