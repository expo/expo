// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 `UpdatesConfig` values set at runtime that override build-time configuration.
 */
public struct UpdatesConfigOverride: Codable {
  private static let kUpdatesConfigOverride = "dev.expo.updates.updatesConfigOverride"

  let updateUrl: URL?
  let requestHeaders: [String: String]?

  public static func load() -> UpdatesConfigOverride? {
    guard let data = UserDefaults.standard.data(forKey: kUpdatesConfigOverride) else {
      return nil
    }
    let decoder = JSONDecoder()
    return try? decoder.decode(UpdatesConfigOverride.self, from: Data(data))
  }

  internal static func save(configOverride: UpdatesConfigOverride?) {
    if let configOverride {
      let encoder = JSONEncoder()
      guard let data = try? encoder.encode(configOverride) else {
        return
      }
      UserDefaults.standard.set(data, forKey: kUpdatesConfigOverride)
    } else {
      UserDefaults.standard.removeObject(forKey: kUpdatesConfigOverride)
    }
  }

  internal static func save(requestHeaders: [String: String]?) -> UpdatesConfigOverride? {
    let newOverride = UpdatesConfigOverride(
      updateUrl: load()?.updateUrl,
      requestHeaders: requestHeaders
    )
    let finalOverride = (newOverride.updateUrl != nil || newOverride.requestHeaders != nil) ? newOverride : nil
    save(configOverride: finalOverride)
    return finalOverride
  }
}
