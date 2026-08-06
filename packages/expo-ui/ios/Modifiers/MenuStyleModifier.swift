// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum MenuStyleType: String, Enumerable {
  case automatic
  case button
}

internal struct MenuStyleModifier: ViewModifier, Record {
  @Field var style: MenuStyleType = .automatic

  @ViewBuilder
  func body(content: Content) -> some View {
    // `ButtonMenuStyle` is unavailable on tvOS; menus there keep the platform default.
    #if os(tvOS)
    content
    #else
    switch style {
    case .button:
      content.menuStyle(.button)
    case .automatic:
      content.menuStyle(.automatic)
    }
    #endif
  }
}
