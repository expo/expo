// Copyright 2015-present 650 Industries. All rights reserved.

internal extension URL {
  func toFilePath() -> String {
    if !self.isFileURL {
      return self.absoluteString
    }
    return self.standardizedFileURL.path
  }
}
