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
    // `MenuStyle` requires iOS 16.0 / tvOS 17.0; below that, menus keep the platform default.
    if #available(iOS 16.0, tvOS 17.0, *) {
      switch style {
      case .button:
        content.menuStyle(.button)
      case .automatic:
        content.menuStyle(.automatic)
      }
    } else {
      content
    }
  }
}
