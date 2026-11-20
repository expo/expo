// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum DatePickerStyleType: String, UIEnum {
  case automatic
  case compact
  case graphical
  case wheel

#if !os(tvOS)
  @ViewBuilder
  func apply<Content: View>(to content: Content) -> some View {
    switch self {
    case .compact:
      content.datePickerStyle(.compact)
    case .graphical:
      content.datePickerStyle(.graphical)
#if !os(macOS)
    case .wheel:
      content.datePickerStyle(.wheel)
#endif
    default:
      content.datePickerStyle(.automatic)
    }
  }
#endif
}

@MainActor @AnyViewBuilder
internal func datePickerStyleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let style: DatePickerStyleType? = try p.value("style", nil)
#if os(tvOS)
  content
#else
  if let style {
    style.apply(to: content)
  } else {
    content
  }
#endif
}
