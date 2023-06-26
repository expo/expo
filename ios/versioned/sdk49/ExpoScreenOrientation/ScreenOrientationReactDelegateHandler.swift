// Copyright 2018-present 650 Industries. All rights reserved.

import ABI49_0_0ExpoModulesCore

public class ScreenOrientationReactDelegateHandler: ExpoReactDelegateHandler {
  public override func createRootViewController(reactDelegate: ExpoReactDelegate) -> UIViewController? {
    return ScreenOrientationViewController(defaultScreenOrientationFromPlist: ())
  }
}
