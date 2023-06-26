// Copyright 2022-present 650 Industries. All rights reserved.

import ABI49_0_0ExpoModulesCore
import ABI49_0_0EXUpdatesInterface

/**
 * Used only in development builds with expo-dev-client; completes the auto-setup for development
 * builds with the expo-updates integration by passing a reference to DevLauncherController
 * over to the registry, which expo-dev-client can access.
 */
public final class ExpoUpdatesAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    if ABI49_0_0EXAppDefines.APP_DEBUG && !UpdatesUtils.isNativeDebuggingEnabled() {
      UpdatesControllerRegistry.sharedInstance.controller = DevLauncherController.sharedInstance
    }
    return true
  }
}
