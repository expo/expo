// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ToggleStyleType: String, Enumerable {
  case automatic
  case `switch`
  case button

  @ViewBuilder
  func apply<Content: View>(to content: Content) -> some View {
    switch self {
    case .switch:
      #if os(tvOS)
      if #available(tvOS 18.0, *) {
        content.toggleStyle(.switch)
      } else {
        content.toggleStyle(.automatic)
      }
      #else
      content.toggleStyle(.switch)
      #endif
    case .button:
      #if os(tvOS)
      content.toggleStyle(.automatic)
      #else
      content.toggleStyle(.button)
      #endif
    default:
      content.toggleStyle(.automatic)
    }
  }
}

@MainActor @AnyViewBuilder
internal func toggleStyleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let style: ToggleStyleType? = try p.value("style", nil)
  if let style {
    style.apply(to: content)
  } else {
    content
  }
}
