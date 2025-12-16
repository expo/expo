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
      content.toggleStyle(.switch)
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

internal struct ToggleStyleModifier: ViewModifier, Record {
  @Field var style: ToggleStyleType?

  @ViewBuilder
  func body(content: Content) -> some View {
    if let style = style {
      style.apply(to: content)
    } else {
      content
    }
  }
}
