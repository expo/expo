// Copyright 2018-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class ExpoDevLauncherAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  #if !os(macOS)
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    EXDevLauncherController.disablePackagerServerAccess()
    // On a scene-lifecycle app (the default), a cold launch delivers its URL through
    // `onDeepLink:options:` via `ExpoAppSceneDelegate`'s `connectionOptions.urlContexts`, so
    // `launchOptions?[.url]` is always nil there and this block does nothing. It only runs on
    // the legacy non-scene `AppDelegate` path, where iOS also calls `application(_:open:options:)`
    // after launch. The responder may then fire twice for one cold launch; that's harmless
    // (same nonce, fire-and-forget, the second POST hits an already-closed callback port).
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
