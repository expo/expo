// Copyright 2022-present 650 Industries. All rights reserved.

import React
import ExpoModulesCore

@objc
public class ExpoDevMenuReactDelegateHandler: ExpoReactDelegateHandler {
  public override func createReactRootView(
    reactDelegate: ExpoReactDelegate,
    moduleName: String,
    initialProperties: [AnyHashable: Any]?,
    launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> UIView? {
    if EXAppDefines.APP_DEBUG {
      DevMenuManager.shared.currentBridge = RCTBridge.current()
    }
    return nil
  }
}
