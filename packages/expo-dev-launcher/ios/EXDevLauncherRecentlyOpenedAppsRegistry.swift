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
  public func appWasOpened(appInfo: [String: Any]) {
    let timestamp = getCurrentTimestamp()

    var appDetails = appInfo
    appDetails["timestamp"] = timestamp
    
    var registry = appRegistry
    registry["\(timestamp)"] = appDetails
    appRegistry = registry
  }

  @objc
  public func recentlyOpenedApps() -> [String: Any] {    
    guard let registry = appRegistry as? [String: [String: Any]] else {
      return [:]
    }

    appRegistry = registry.filter { (url: String, appEntry: [String: Any]) in
      if getCurrentTimestamp() - (appEntry["timestamp"] as! Int64) > TIME_TO_REMOVE {
        return false
      }

      return true
    }
    
    return appRegistry
  }
  
  @objc
  public func clearRegistry() {
    resetStorage()
  }

  func getCurrentTimestamp() -> Int64 {
    return Int64(Date().timeIntervalSince1970 * 1_000)
  }

  func resetStorage() {
    UserDefaults.standard.removeObject(forKey: RECENTLY_OPENED_APPS_REGISTRY_KEY)
  }
}
