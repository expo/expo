// Copyright 2024-present 650 Industries. All rights reserved.
import ExpoModulesCore

@objc(ExBackgroundTaskAppDelegate)
public class BackgroundTaskAppDelegate: ExpoAppDelegateSubscriber {
  public func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
    
    BackgroundTaskModule.registerHandler()
    return true
  }
}
