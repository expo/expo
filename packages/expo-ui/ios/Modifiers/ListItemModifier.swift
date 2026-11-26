// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct MoveDisabledModifier: ViewModifier, UIRecord {
  @Field var disabled: Bool = true

  func body(content: Content) -> some View {
    content.moveDisabled(disabled)
  }
}

internal struct DeleteDisabledModifier: ViewModifier, UIRecord {
  @Field var disabled: Bool = true

  func body(content: Content) -> some View {
    content.deleteDisabled(disabled)
  }
}
