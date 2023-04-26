// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class ScreenOrientationAppDelegate: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    ScreenOrientationRegistry.shared.updateCurrentScreenOrientation()
    return true
  }

  public func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
    let mask = ScreenOrientationRegistry.shared.currentOrientationMask
    return ScreenOrientationRegistry.shared.currentOrientationMask
  }
}
