// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 `UpdatesConfig` values set at runtime that override build-time configuration.
 */
public struct UpdatesConfigOverride: Record, Codable {
  public init() {
  }

  @Field var updateUrl: URL?
  @Field var requestHeaders: [String: String]

  public init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    let urlString = try container.decode(String.self, forKey: .updateUrl)
    self.updateUrl = URL(string: urlString)
    self.requestHeaders = try container.decode([String: String].self, forKey: .requestHeaders)
  }

  public func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    if let updateUrl {
      try container.encode(updateUrl.absoluteString, forKey: .updateUrl)
    }
    try container.encode(self.requestHeaders, forKey: .requestHeaders)
  }

  private enum CodingKeys: String, CodingKey {
    case updateUrl
    case requestHeaders
  }

  internal static func load() -> UpdatesConfigOverride? {
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
