// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal enum KeepFullscreenOnPiPStopBehavior: String, Enumerable {
  case always
  case autoEnter
  case never

  func shouldRestore(pipWasAutoEntered: Bool) -> Bool {
    switch self {
    case .always:
      return true
    case .autoEnter:
      return pipWasAutoEntered
    case .never:
      return false
    }
  }
}
