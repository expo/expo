// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class ExpoDevLauncherAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    if !ExpoDevLauncherReactDelegateHandler.shouldEnableAutoSetup {
      return false
    }

    guard let window = UIApplication.shared.windows.filter {$0.isKeyWindow}.first else {
      fatalError("Cannot find the keyWindow. Make sure to call `window.makeKeyAndVisible()`.")
    }
    EXDevLauncherController.sharedInstance().autoSetupStart(window)
    return false
  }

  public func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    if !ExpoDevLauncherReactDelegateHandler.shouldEnableAutoSetup {
      return false
    }

    return EXDevLauncherController.sharedInstance().onDeepLink(url, options: options)
  }
}
