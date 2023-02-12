// Copyright 2022-present 650 Industries. All rights reserved.

import ABI47_0_0ExpoModulesCore
import ABI47_0_0EXUpdatesInterface

/**
 * Used only in development builds with expo-dev-client; completes the auto-setup for development
 * builds with the expo-updates integration by passing a reference to ABI47_0_0EXUpdatesDevLauncherController
 * over to the registry, which expo-dev-client can access.
 */
public class ExpoUpdatesAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    if ABI47_0_0EXAppDefines.APP_DEBUG && !ABI47_0_0EXUpdatesUtils.isNativeDebuggingEnabled() {
      ABI47_0_0EXUpdatesControllerRegistry.sharedInstance().controller = ABI47_0_0EXUpdatesDevLauncherController.sharedInstance()
    }
    return true
  }
}
