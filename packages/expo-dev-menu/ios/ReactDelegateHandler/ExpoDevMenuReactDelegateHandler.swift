// Copyright 2022-present 650 Industries. All rights reserved.

import React
import ExpoModulesCore

@objc
public class ExpoDevMenuReactDelegateHandler: ExpoReactDelegateHandler {
  public override func createRootViewController() -> UIViewController? {
    if EXAppDefines.APP_DEBUG {
      DevMenuManager.shared.updateCurrentBridge(RCTBridge.current())
    }
    return nil
  }
}
