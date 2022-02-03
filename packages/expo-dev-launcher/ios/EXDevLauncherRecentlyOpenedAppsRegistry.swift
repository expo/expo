// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

let RECENTLY_OPENED_APPS_REGISTRY_KEY = "expo.devlauncher.recentlyopenedapps"

let TIME_TO_REMOVE = 1_000 * 60 * 60 * 24 * 3 // 3 days

@objc(EXDevLauncherRecentlyOpenedAppsRegistry)
public class EXDevLauncherRecentlyOpenedAppsRegistry: NSObject {
  private var appRegistry: [String: Any] {
    get {
      return UserDefaults.standard.dictionary(forKey: RECENTLY_OPENED_APPS_REGISTRY_KEY) ?? [String: Any]()
    }
    set (newAppRegistry) {
      UserDefaults.standard.set(newAppRegistry, forKey: RECENTLY_OPENED_APPS_REGISTRY_KEY)
    }
  }

  @objc
  public func appWasOpened(_ url: String, name: String?) {
    var registry = appRegistry
    var appEntry: [String: Any] = ["timestamp": getCurrentTimestamp()]
    if name != nil {
      appEntry["name"] = name
    }
    registry[url] = appEntry
    appRegistry = registry
  }

  @objc
  public func recentlyOpenedApps() -> [String: Any] {
    var result = [String: Any]()
    guard let registry = appRegistry as? [String: [String: Any]] else {
      return [:]
    }

    appRegistry = registry.filter { (url: String, appEntry: [String: Any]) in
      if getCurrentTimestamp() - (appEntry["timestamp"] as! Int64) > TIME_TO_REMOVE {
        return false
      }

      result[url] = appEntry["name"] ?? NSNull()
      return true
    }

    return result
  }

  func getCurrentTimestamp() -> Int64 {
    return Int64(Date().timeIntervalSince1970 * 1_000)
  }

  func resetStorage() {
    UserDefaults.standard.removeObject(forKey: RECENTLY_OPENED_APPS_REGISTRY_KEY)
  }
}
