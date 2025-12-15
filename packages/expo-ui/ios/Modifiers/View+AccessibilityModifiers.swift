// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal extension View {
  @ViewBuilder
  func applyAccessibilityIdentifier(_ testID: String?) -> some View {
    if let testID {
      self.accessibilityIdentifier(testID)
    } else {
      self
    }
  }
}
