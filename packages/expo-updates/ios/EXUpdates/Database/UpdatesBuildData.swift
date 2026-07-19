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
 *   EXUpdatesURL
 *
 * and all of the values in json
 *
 *   EXUpdatesRequestHeaders
 */
internal final class UpdatesBuildData {
  static func ensureBuildDataIsConsistentAsync(database: UpdatesDatabase, config: UpdatesConfig, logger: UpdatesLogger) {
    database.databaseQueue.async {
      let scopeKey = config.scopeKey

      let staticBuildData: [AnyHashable: Any]?
      do {
        staticBuildData = try database.staticBuildData(withScopeKey: scopeKey)
      } catch {
        logger.warn(message: "Error getting static build data: \(error.localizedDescription)")
        return
      }
      let buildDataFromConfig = self.getBuildDataFromConfig(config)

      if let staticBuildData,
        !isBuildDataConsistent(staticBuildData, buildDataFromConfig) {
        clearAllUpdatesAndSetStaticBuildData(database: database, config: config, logger: logger, scopeKey: scopeKey)
        clearManifestMetadataFromDatabase(database: database, logger: logger)
      } else {
        do {
          try database.setStaticBuildData(getBuildDataFromConfig(config), withScopeKey: scopeKey)
        } catch {
          logger.warn(message: "Error setting static build data: \(error.localizedDescription)")
          return
        }
      }
    }
  }

  /**
   Fallback data specifically for migration while database data doesn't have these keys
   */
  private static let defaultBuildData: [String: Any] = [
    "EXUpdatesHasEmbeddedUpdate": true
  ]

  static func getBuildDataFromConfig(_ config: UpdatesConfig) -> [String: Any] {
    return [
      "EXUpdatesURL": config.updateUrl.absoluteString,
      "EXUpdatesRequestHeaders": config.requestHeaders,
      "EXUpdatesHasEmbeddedUpdate": config.hasEmbeddedUpdate
    ]
  }

  static func clearAllUpdatesAndSetStaticBuildData(database: UpdatesDatabase, config: UpdatesConfig, logger: UpdatesLogger, scopeKey: String) {
    let allUpdates: [Update]
    do {
      allUpdates = try database.allUpdates(withConfig: config)
    } catch {
      logger.warn(message: "Error loading updates from database: \(error.localizedDescription)")
      return
    }

    do {
      try database.deleteUpdates(allUpdates)
    } catch {
      logger.warn(message: "Error clearing all updates from database: \(error.localizedDescription)")
      return
    }

    do {
      try database.setStaticBuildData(getBuildDataFromConfig(config), withScopeKey: scopeKey)
    } catch {
      logger.warn(message: "Error setting static build data: \(error.localizedDescription)")
      return
    }
  }

  private static func clearManifestMetadataFromDatabase(database: UpdatesDatabase, logger: UpdatesLogger) {
    do {
      try database.deleteJsonDataForAllScopeKeys(withKeys: [
        UpdatesDatabase.JSONDataKey.ExtraParmasKey,
        UpdatesDatabase.JSONDataKey.ServerDefinedHeadersKey,
        UpdatesDatabase.JSONDataKey.ManifestFiltersKey
      ])
    } catch {
      logger.warn(message: "Error deleting JSON data from database: \(error.localizedDescription)")
      return
    }
  }

  internal static func isBuildDataConsistent(_ lhs: [AnyHashable: Any], _ rhs: [AnyHashable: Any]) -> Bool {
    let lhsWithDefault = lhs
      .merging(defaultBuildData) { current, _ in current }
    let rhsWithDefault = rhs
      .merging(defaultBuildData) { current, _ in current }
    // safest dictionary comparison conversion is still in objective-c
    // swiftlint:disable:next legacy_objc_type
    return NSDictionary(dictionary: lhsWithDefault).isEqual(to: rhsWithDefault)
  }
}
