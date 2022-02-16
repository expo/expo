// Copyright 2015-present 650 Industries. All rights reserved.

import EXDevMenuInterface

class DevMenuExtensionDefaultSettings: DevMenuExtensionSettingsProtocol {
  private let manager: DevMenuManager

  init(manager: DevMenuManager) {
    self.manager = manager
  }

  func wasRunOnDevelopmentBridge() -> Bool {
    #if DEBUG
      return true
    #else
      return false
    #endif
  }
}
