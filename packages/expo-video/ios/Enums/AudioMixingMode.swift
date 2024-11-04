// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore
import CoreMedia

internal enum AudioMixingMode: String, Enumerable {
  case mixWithOthers
  case duckOthers
  case doNotMix
  case auto

  func priority() -> Int {
    switch self {
    case .doNotMix:
      return 3
    case .auto:
      return 2
    case .duckOthers:
      return 1
    case .mixWithOthers:
      return 0
    }
  }

  func toSessionCategoryOption() -> AVAudioSession.CategoryOptions? {
    switch self {
    case .duckOthers:
      return .duckOthers
    case .mixWithOthers:
      return .mixWithOthers
    case .doNotMix:
      return nil
    case .auto:
      return nil
    }
  }
}
