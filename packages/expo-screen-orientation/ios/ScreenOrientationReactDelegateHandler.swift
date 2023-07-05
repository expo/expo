// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

@objc(EXScreenOrientationReactDelegateHandler)
public class ScreenOrientationReactDelegateHandler: ExpoReactDelegateHandler {
  public override func createRootViewController(reactDelegate: ExpoReactDelegate) -> UIViewController? {
    return ScreenOrientationViewController(defaultScreenOrientationFromPlist: ())
  }
}
