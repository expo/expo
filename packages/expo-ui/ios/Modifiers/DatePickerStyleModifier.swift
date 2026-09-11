// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum DatePickerStyleType: String, Enumerable {
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
// The wheel style is unavailable on macOS; it falls through to `automatic` below.
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

internal struct DatePickerStyleModifier: ViewModifier, Record {
  @Field var style: DatePickerStyleType?

  @ViewBuilder
  func body(content: Content) -> some View {
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
}
