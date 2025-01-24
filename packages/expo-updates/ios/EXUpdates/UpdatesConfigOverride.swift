// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 `UpdatesConfig` values set at runtime that override build-time configuration.
 */
public struct UpdatesConfigOverride: Codable {
  let updateUrl: URL?
  let requestHeaders: [String: String]

  public static func load() -> UpdatesConfigOverride? {
    guard let data = UserDefaults.standard.data(forKey: UpdatesConfig.kUpdatesConfigOverride) else {
      return nil
    }
    let decoder = JSONDecoder()
    return try? decoder.decode(UpdatesConfigOverride.self, from: Data(data))
  }

  internal static func save(_ configOverride: UpdatesConfigOverride?) {
    if let configOverride {
      let encoder = JSONEncoder()
      guard let data = try? encoder.encode(configOverride) else {
        return
      }
      UserDefaults.standard.set(data, forKey: UpdatesConfig.kUpdatesConfigOverride)
    } else {
      UserDefaults.standard.removeObject(forKey: UpdatesConfig.kUpdatesConfigOverride)
    }
  }
}

/**
 `UpdatesConfigOverride` parameters passing from JavaScript.
 */
internal struct UpdatesConfigOverrideParam: Record {
  @Field var updateUrl: URL?
  @Field var requestHeaders: [String: String]

  func toUpdatesConfigOverride() -> UpdatesConfigOverride {
    return UpdatesConfigOverride(
      updateUrl: updateUrl,
      requestHeaders: requestHeaders
    )
  }
}
