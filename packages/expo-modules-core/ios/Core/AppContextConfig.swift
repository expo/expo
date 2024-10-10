// Copyright 2023-present 650 Industries. All rights reserved.

public struct AppContextConfig {
  public let documentDirectory: URL?
  public let cacheDirectory: URL?
  public let appGroupSharedDirectories: [URL]

  public init(documentDirectory: URL?, cacheDirectory: URL?, appGroups: [String]?) {
    self.documentDirectory = documentDirectory ?? FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first
    self.cacheDirectory = cacheDirectory ?? FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first

    var sharedDirectories: [URL] = []
    for appGroup in appGroups ?? [] {
      if let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) {
        sharedDirectories.append(directory)
      }
    }
    self.appGroupSharedDirectories = sharedDirectories
  }
}
