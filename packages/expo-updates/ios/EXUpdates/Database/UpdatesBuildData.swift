// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/**
 * The build data stored by the configuration is subject to change when
 * a user updates the binary.
 *
 * This can lead to inconsistent update loading behavior, for
 * example: https://github.com/expo/expo/issues/14372
 *
 * This class wipes the updates when any of the tracked build data
 * changes. This leaves the user in the same situation as a fresh install.
 *
 * So far we only know that `releaseChannel` and
 * `requestHeaders[expo-channel-name]` are dangerous to change, but have
 * included a few more that both seem unlikely to change (so we clear
 * the updates cache rarely) and likely to
 * cause bugs when they do. The tracked fields are:
 *
 *   EXUpdatesReleaseChannel
 *   EXUpdatesURL
 *
 * and all of the values in json
 *
 *   EXUpdatesRequestHeaders
 */
internal final class UpdatesBuildData {
  static func ensureBuildDataIsConsistentAsync(database: UpdatesDatabase, config: UpdatesConfig) {
    database.databaseQueue.async {
      let scopeKey = config.scopeKey

      let staticBuildData: [AnyHashable: Any]?
      do {
        staticBuildData = try database.staticBuildData(withScopeKey: scopeKey)
      } catch {
        NSLog("Error getting static build data: %@", [error.localizedDescription])
        return
      }

      if let staticBuildData = staticBuildData {
        let impliedStaticBuildData = self.getBuildDataFromConfig(config)
        // safest dictionary comparison conversion is still in objective-c
        // swiftlint:disable:next legacy_objc_type
        if !NSDictionary(dictionary: staticBuildData).isEqual(to: impliedStaticBuildData) {
          clearAllUpdatesAndSetStaticBuildData(database: database, config: config, scopeKey: scopeKey)
        }
      } else {
        do {
          try database.setStaticBuildData(getBuildDataFromConfig(config), withScopeKey: scopeKey)
        } catch {
          NSLog("Error setting static build data: %@", [error.localizedDescription])
          return
        }
      }
    }
  }

  static func getBuildDataFromConfig(_ config: UpdatesConfig) -> [String: Any] {
    return [
      "EXUpdatesURL": config.updateUrl.absoluteString,
      "EXUpdatesReleaseChannel": config.releaseChannel,
      "EXUpdatesRequestHeaders": config.requestHeaders
    ]
  }

  static func clearAllUpdatesAndSetStaticBuildData(database: UpdatesDatabase, config: UpdatesConfig, scopeKey: String) {
    let allUpdates: [Update]
    do {
      allUpdates = try database.allUpdates(withConfig: config)
    } catch {
      NSLog("Error loading updates from database: %@", [error.localizedDescription])
      return
    }

    do {
      try database.deleteUpdates(allUpdates)
    } catch {
      NSLog("Error clearing all updates from database: %@", [error.localizedDescription])
      return
    }

    do {
      try database.setStaticBuildData(getBuildDataFromConfig(config), withScopeKey: scopeKey)
    } catch {
      NSLog("Error setting static build data: %@", [error.localizedDescription])
      return
    }
  }
}
