// Copyright 2022-present 650 Industries. All rights reserved.

import ABI48_0_0ExpoModulesCore
import ABI48_0_0EXUpdatesInterface

/**
 * Used only in development builds with expo-dev-client; completes the auto-setup for development
 * builds with the expo-updates integration by passing a reference to ABI48_0_0EXUpdatesDevLauncherController
 * over to the registry, which expo-dev-client can access.
 */
public class ExpoUpdatesAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    if ABI48_0_0EXAppDefines.APP_DEBUG && !ABI48_0_0EXUpdatesUtils.isNativeDebuggingEnabled() {
      ABI48_0_0EXUpdatesControllerRegistry.sharedInstance().controller = ABI48_0_0EXUpdatesDevLauncherController.sharedInstance()
    }
    return true
  }
}
