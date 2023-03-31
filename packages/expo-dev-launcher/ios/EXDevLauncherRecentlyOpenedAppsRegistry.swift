// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import EXManifests

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
  public func appWasOpened(_ url: String, queryParams: [String: String], manifest: Manifest?) {
    var appEntry: [String: Any] = [:]

    // reloading the same url - update the old entry w/ any new fields instead of creating a new one
    if let previousMatchingEntry = appRegistry[url] {
      appEntry = previousMatchingEntry as! [String : Any]
    }

    let timestamp = getCurrentTimestamp()

    var isEASUpdate = false

    if let host = URL(string:url)?.host {
      isEASUpdate = host == "u.expo.dev" || host == "staging-u.expo.dev"
    }

    appEntry["isEASUpdate"] = isEASUpdate

    if isEASUpdate {
      if let updateMessage = queryParams["updateMessage"] {
        appEntry["updateMessage"] = updateMessage
      }
    }

    if let manifest = manifest {
      appEntry["name"] = manifest.name()

      // TODO - expose metadata object in expo-manifests
      let json = manifest.rawManifestJSON()

      if (isEASUpdate) {
        if let metadata: [String: Any] = json["metadata"] as? [String : Any], let branchName = metadata["branchName"] {
          appEntry["branchName"] = branchName;
        }
      }
    }

    appEntry["timestamp"] = timestamp
    appEntry["url"] = url

    var registry = appRegistry
    registry[url] = appEntry
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
}
