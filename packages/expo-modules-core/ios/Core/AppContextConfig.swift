// Copyright 2023-present 650 Industries. All rights reserved.

public struct AppContextConfig {
  public static var `default` = AppContextConfig()

  public let documentDirectory: URL?
  public let cacheDirectory: URL?

  public init(documentDirectory: URL? = nil, cacheDirectory: URL? = nil) {
    self.documentDirectory = documentDirectory ?? FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
    self.cacheDirectory = cacheDirectory ?? FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first
  }
}
