// Copyright 2023-present 650 Industries. All rights reserved.

public struct AppContextConfig {
  public static var `default` = AppContextConfig()

  public let documentDirectory: URL?
  public let cacheDirectory: URL?
  public let bundleDirectory: URL?

  public init(documentDirectory: URL? = nil, cacheDirectory: URL? = nil, bundleDirectory: URL? = nil) {
    self.documentDirectory = documentDirectory ?? FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
    self.cacheDirectory = cacheDirectory ?? FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first
    self.bundleDirectory = bundleDirectory ?? URL(string: Bundle.main.bundlePath)
  }
}
