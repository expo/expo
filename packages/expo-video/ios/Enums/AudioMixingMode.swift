// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore
import CoreMedia

internal enum AudioMixingMode: String, Enumerable {
  case mixWithOthers
  case duckOthers
  case doNotMix
  case auto
}
