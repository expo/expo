// Copyright 2015-present 650 Industries. All rights reserved.

/**
 Class that represents a "session" as of the dev menu is open until it gets closed.
 */
public class DevMenuSession {
  /**
   The bridge that the dev menu is currently rendered for.
   */
  public private(set) var bridge: RCTBridge

  /**
   A dictionary of app info corresponding to the `bridge` or guessed based on app's metadata.
   */
  public private(set) var appInfo: [String : Any]

  init(bridge: RCTBridge, appInfo: [String : Any]?) {
    self.bridge = bridge
    self.appInfo = appInfo ?? guessAppInfo(forBridge: bridge)
  }
}

/**
 Constructs app info dictionary based on the native app metadata such as `Info.plist`.
 Pretty handy in greenfield apps where we don't have to provide anything else.
 */
fileprivate func guessAppInfo(forBridge bridge: RCTBridge) -> [String : Any] {
  guard let infoDictionary = Bundle.main.infoDictionary else {
    return [:]
  }
  return [
    "appName": infoDictionary["CFBundleDisplayName"] ?? infoDictionary["CFBundleExecutable"],
    "appVersion": infoDictionary["CFBundleVersion"],
    "appIcon": findAppIconPath(),
    "hostUrl": bridge.bundleURL?.absoluteString ?? NSNull(),
  ]
}

/**
 Naively finds path to the AppIcon. It assumes the icon doesn't have a custom name and 60pt version is provided.
 */
fileprivate func findAppIconPath() -> String? {
  if let path = Bundle.main.path(forResource: "AppIcon60x60@3x", ofType: "png")
    ?? Bundle.main.path(forResource: "AppIcon60x60@2x", ofType: "png") {
    return "file://".appending(path)
  }
  return nil
}
