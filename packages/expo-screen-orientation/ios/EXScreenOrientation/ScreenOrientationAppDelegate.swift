// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class ScreenOrientationAppDelegate: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    if let screenOrientationRegistry = ModuleRegistryProvider.getSingletonModule(for: EXScreenOrientationRegistry.self) as? EXScreenOrientationRegistry {
      screenOrientationRegistry.updateCurrentScreenOrientation()
    }
    return true
  }
}
