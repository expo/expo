// Copyright 2015-present 650 Industries. All rights reserved.

import CoreGraphics

enum DevMenuSheetDetent {
  static let defaultFraction: CGFloat = 0.6

  static func height(maximum: CGFloat, onboardingHeight: CGFloat?) -> CGFloat {
    let base = maximum * defaultFraction
    guard let onboardingHeight else {
      return base
    }
    return min(max(base, onboardingHeight), maximum)
  }
}
