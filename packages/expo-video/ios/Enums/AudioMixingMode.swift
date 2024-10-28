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
      return 0
    case .auto:
      return 1
    case .duckOthers:
      return 2
    case .mixWithOthers:
      return 3
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
