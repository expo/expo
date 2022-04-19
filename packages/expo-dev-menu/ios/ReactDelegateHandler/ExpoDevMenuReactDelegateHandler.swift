// Copyright 2022-present 650 Industries. All rights reserved.

import React
import ExpoModulesCore

public class ExpoDevMenuReactDelegateHandler: ExpoReactDelegateHandler {
  public static var enableAutoSetup: Bool?

  private static var shouldEnableAutoSetup: Bool = {
    // if someone else has set this explicitly, use that value
    if enableAutoSetup != nil {
      return enableAutoSetup!
    }

    if !EXAppDefines.APP_DEBUG {
      return false
    }

    return true
  }()

  public override func createRootView(reactDelegate: ExpoReactDelegate, bridge: RCTBridge, moduleName: String, initialProperties: [AnyHashable : Any]?) -> RCTRootView? {
    if ExpoDevMenuReactDelegateHandler.shouldEnableAutoSetup {
      DevMenuManager.shared.currentBridge = bridge
    }
    return nil
  }
}
