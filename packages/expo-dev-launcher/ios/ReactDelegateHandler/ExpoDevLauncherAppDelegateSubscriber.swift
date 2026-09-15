// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class ExpoDevLauncherAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  #if !os(macOS)
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    EXDevLauncherController.disablePackagerServerAccess()
    // iOS also delivers a cold-launch URL to `application(_:open:)`, so the check can run twice.
    // Harmless: the callback server is one-shot, so the second POST finds the port closed.
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
