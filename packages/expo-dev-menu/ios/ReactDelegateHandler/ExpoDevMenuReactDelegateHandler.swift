// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class ExpoDevMenuReactDelegateHandler: ExpoReactDelegateHandler {
  public static var shouldEnableAutoSetup: Bool = {
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
