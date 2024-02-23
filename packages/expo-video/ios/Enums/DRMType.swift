// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal enum DRMType: String, Enumerable {
  case clearkey
  case fairplay
  case playready
  case widevine

  func isSupported() -> Bool {
    return self == .fairplay
  }

  internal func assertIsSupported() throws {
    if !isSupported() {
      throw DRMUnsupportedException(self)
    }
  }
}
