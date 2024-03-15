// Copyright 2022-present 650 Industries. All rights reserved.

import React
import ExpoModulesCore

@objc
public class ExpoDevMenuReactDelegateHandler: ExpoReactDelegateHandler {
  @objc
  public static var enableAutoSetup: Bool = true

  private static var shouldEnableAutoSetup: Bool = {
    // if someone else has set this explicitly, use that value
    if !enableAutoSetup {
      return false
    }

    if !EXAppDefines.APP_DEBUG {
      return false
    }

    return true
  }()

  public override func createReactRootView(
    reactDelegate: ExpoReactDelegate,
    moduleName: String,
    initialProperties: [AnyHashable: Any]?,
    launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> UIView? {
    if ExpoDevMenuReactDelegateHandler.shouldEnableAutoSetup {
      DevMenuManager.shared.currentBridge = RCTBridge.current()
    }
    return nil
  }
}
