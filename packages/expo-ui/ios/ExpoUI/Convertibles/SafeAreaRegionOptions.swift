// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum SafeAreaRegionOptions: String, Enumerable {
  case all
  case container
  case keyboard

  func toSafeAreaRegions() -> SafeAreaRegions {
    switch self {
    case .all:
      return .all
    case .container:
      return .container
    case .keyboard:
      return .keyboard
    }
  }
}
