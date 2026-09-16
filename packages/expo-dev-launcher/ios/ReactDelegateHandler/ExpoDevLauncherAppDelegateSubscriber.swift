// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class ExpoDevLauncherAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  #if !os(macOS)
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    EXDevLauncherController.disablePackagerServerAccess()
    // Non-scene apps only: UIKit puts a cold-launch URL here. A scene app reads nil, because its
    // URL reaches `application(_:open:)` through the scene instead. Non-scene apps get that call
    // too, so this is the first of two — `handle` claims the nonce and the second delivery is
    // ignored.
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
