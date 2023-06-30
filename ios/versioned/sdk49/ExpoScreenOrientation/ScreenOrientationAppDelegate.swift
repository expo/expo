// Copyright 2018-present 650 Industries. All rights reserved.

import ABI49_0_0ExpoModulesCore

@objc(ABI49_0_0EXScreenOrientationAppDelegate)
public class ScreenOrientationAppDelegate: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    ScreenOrientationRegistry.shared.updateCurrentScreenOrientation()
    return true
  }

  public func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    return ScreenOrientationRegistry.shared.currentOrientationMask
  }
}
