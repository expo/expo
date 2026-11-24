// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct MenuIndicatorModifier: ViewModifier, Record {
  @Field var visibility: VisibilityOptions = .automatic

  @ViewBuilder
  func body(content: Content) -> some View {
    // `menuIndicator(_:)` requires iOS 15.0 / tvOS 17.0.
    if #available(iOS 15.0, tvOS 17.0, *) {
      content.menuIndicator(visibility.toVisibility())
    } else {
      content
    }
  }
}
