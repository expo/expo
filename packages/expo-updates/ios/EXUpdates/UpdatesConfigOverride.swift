// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 Runtime overridable config from build time UpdatesConfig
 */
public struct UpdatesConfigOverride: Record, Codable {
  public init() {
  }

  @Field var url: URL?
  @Field var requestHeaders: [String: String]

  public init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    let urlString = try container.decode(String.self, forKey: .url)
    self.url = URL(string: urlString)
    self.requestHeaders = try container.decode([String: String].self, forKey: .requestHeaders)
  }

  public func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    if let url {
      try container.encode(url.absoluteString, forKey: .url)
    }
    try container.encode(self.requestHeaders, forKey: .requestHeaders)
  }

  private enum CodingKeys: String, CodingKey {
    case url
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
