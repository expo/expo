// Copyright 2022-present 650 Industries. All rights reserved.

import ABI45_0_0ExpoModulesCore
import ABI45_0_0EXUpdatesInterface

public class ExpoUpdatesAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    if ABI45_0_0EXAppDefines.APP_DEBUG {
      ABI45_0_0EXUpdatesControllerRegistry.sharedInstance().controller = ABI45_0_0EXUpdatesDevLauncherController.sharedInstance()
    }
    return true
  }
}
