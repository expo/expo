// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal extension View {
  @ViewBuilder
  func applyFixedSize(_ fixedSize: Bool?) -> some View {
    if fixedSize == true {
      self.fixedSize()
    } else {
      self
    }
  }
}
