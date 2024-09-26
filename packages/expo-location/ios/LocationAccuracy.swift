// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal enum LocationAccuracy: Int, Enumerable {
  case lowest = 1
  case low = 2
  case balanced = 3
  case high = 4
  case highest = 5
  case bestForNavigation = 6

  func toCLLocationAccuracy() -> CLLocationAccuracy {
    switch self {
    case .lowest:
      return kCLLocationAccuracyThreeKilometers
    case .low:
      return kCLLocationAccuracyKilometer
    case .balanced:
      return kCLLocationAccuracyHundredMeters
    case .high:
      return kCLLocationAccuracyNearestTenMeters
    case .highest:
      return kCLLocationAccuracyBest
    case .bestForNavigation:
      return kCLLocationAccuracyBestForNavigation
    }
  }
}
