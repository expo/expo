// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct MenuIndicatorModifier: ViewModifier, Record {
  @Field var visibility: VisibilityOptions = .automatic

  @ViewBuilder
  func body(content: Content) -> some View {
    // `menuIndicator(_:)` is unavailable on tvOS.
    #if os(tvOS)
    content
    #else
    content.menuIndicator(visibility.toVisibility())
    #endif
  }
}
