// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore
import EXUpdatesInterface

/**
 * Used only in development builds with expo-dev-client; completes the auto-setup for development
 * builds with the expo-updates integration by passing a reference to EXUpdatesDevLauncherController
 * over to the registry, which expo-dev-client can access.
 */
public class ExpoUpdatesAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    if EXAppDefines.APP_DEBUG && !EXUpdatesUtils.isNativeDebuggingEnabled() {
      EXUpdatesControllerRegistry.sharedInstance().controller = EXUpdatesDevLauncherController.sharedInstance()
    }
    return true
  }
}
