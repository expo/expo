// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class ExpoDevLauncherAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  #if !os(macOS)
  public func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    return EXDevLauncherController.sharedInstance().onDeepLink(url, options: options)
  }
  #else
  public func application(_ app: NSApplication, open urls: [URL]) {
    EXDevLauncherController.sharedInstance().onDeepLink(urls[0], options: [:])
  }
  #endif
}
