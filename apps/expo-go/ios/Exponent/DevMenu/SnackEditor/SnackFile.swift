// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

public struct SnackFile: Sendable {
  public let path: String
  public let contents: String
  public let isAsset: Bool

  public init(path: String, contents: String, isAsset: Bool) {
    self.path = path
    self.contents = contents
    self.isAsset = isAsset
  }
}
