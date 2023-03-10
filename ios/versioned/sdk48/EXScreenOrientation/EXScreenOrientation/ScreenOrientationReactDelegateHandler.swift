// Copyright 2018-present 650 Industries. All rights reserved.

import ABI48_0_0ExpoModulesCore

public class ScreenOrientationReactDelegateHandler: ExpoReactDelegateHandler {
  public override func createRootViewController(reactDelegate: ExpoReactDelegate) -> UIViewController? {
    return ABI48_0_0EXScreenOrientationViewController(defaultScreenOrientationFromPlist: ())
  }
}
