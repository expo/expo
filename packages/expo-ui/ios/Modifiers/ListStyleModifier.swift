// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ListStyleType: String, Enumerable {
  case automatic
  case grouped
  case plain
  case insetGrouped
  case inset
  case sidebar

  @ViewBuilder
  func apply<Content: View>(to content: Content) -> some View {
    switch self {
    case .plain:
      content.listStyle(.plain)
// `grouped` and `insetGrouped` are unavailable on macOS, which has no grouped list styles.
// They fall through to `automatic` below.
#if !os(macOS)
    case .grouped:
      content.listStyle(.grouped)
#endif
#if !os(tvOS) && !os(macOS)
    case .insetGrouped:
      content.listStyle(.insetGrouped)
#endif
#if !os(tvOS)
    case .inset:
      content.listStyle(.inset)
    case .sidebar:
      content.listStyle(.sidebar)
#endif
    default:
      content.listStyle(.automatic)
    }
  }
}

internal struct ListStyleModifier: ViewModifier, Record {
  @Field var style: ListStyleType?

  @ViewBuilder
  func body(content: Content) -> some View {
    if let style {
      style.apply(to: content)
    } else {
      content
    }
  }
}
