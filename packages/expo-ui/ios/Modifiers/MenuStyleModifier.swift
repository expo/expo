// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum MenuStyleType: String, Enumerable {
  case automatic
  case button
}

@MainActor @AnyViewBuilder
internal func menuStyleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let style: MenuStyleType = try p.value("style", .automatic)
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
