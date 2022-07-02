// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXUpdatesInterface

public class ExpoUpdatesAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    if EXAppDefines.APP_DEBUG {
      EXUpdatesControllerRegistry.sharedInstance().controller = EXUpdatesDevLauncherController.sharedInstance()
    }
    return true
  }
}
