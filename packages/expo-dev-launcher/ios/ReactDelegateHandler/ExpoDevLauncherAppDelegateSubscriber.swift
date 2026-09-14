// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class ExpoDevLauncherAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  #if !os(macOS)
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    EXDevLauncherController.disablePackagerServerAccess()
    // Only an app without a scene delegate gets a launch URL here, and it sees the same URL again
    // through `application(_:open:)`. Running twice is harmless: same nonce, closed callback port.
    if let url = launchOptions?[.url] as? URL {
      _ = EXDevLauncherFingerprintCheck.handle(url)
    }
    return true
  }

  public func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    return EXDevLauncherController.sharedInstance().onDeepLink(url, options: options)
  }
  #else
  public func applicationDidFinishLaunching(_ notification: Notification) {
    EXDevLauncherController.disablePackagerServerAccess()
  }

  public func application(_ app: NSApplication, open urls: [URL]) {
    EXDevLauncherController.sharedInstance().onDeepLink(urls[0], options: [:])
  }
  #endif
}
