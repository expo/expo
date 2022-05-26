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
  public func appWasOpened(_ url: URL) {
    var appEntry: [String: Any] = [:]
    
    let urlAsString = url.absoluteString
    let timestamp = getCurrentTimestamp()
        
    var isEASUpdate = false
    
    if let host = url.host {
      isEASUpdate = host == "u.expo.dev" || host == "staging-u.expo.dev"
    }
    
    appEntry["isEASUpdate"] = isEASUpdate
  
    if let branchName = getQueryStringParameter(url: url, param: "branchName") {
      appEntry["branchName"] = branchName
    }
    
    if let updateMessage = getQueryStringParameter(url: url, param: "updateMessage") {
      appEntry["updateMessage"] = updateMessage
    }
    
    appEntry["timestamp"] = timestamp
    appEntry["url"] = urlAsString
    
    var registry = appRegistry
    registry[urlAsString] = appEntry
    appRegistry = registry
  }

  @objc
  public func recentlyOpenedApps() -> [[String: Any]] {
    guard let registry = appRegistry as? [String: [String: Any]] else {
      return []
    }
    
    var apps: [[String: Any]] = []

    appRegistry = registry.filter { (url: String, appEntry: [String: Any]) in
      if getCurrentTimestamp() - (appEntry["timestamp"] as! Int64) > TIME_TO_REMOVE {
        return false
      }

      apps.append(appEntry)
      return true
    }
    
    return apps
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
  
  func getQueryStringParameter(url: URL, param: String) -> String? {
    guard let url = URLComponents(string: url.absoluteString) else { return nil }
    return url.queryItems?.first(where: { $0.name == param })?.value
  }
}
