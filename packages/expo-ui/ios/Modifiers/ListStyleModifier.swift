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
    case .grouped:
      content.listStyle(.grouped)
    case .plain:
      content.listStyle(.plain)
#if !os(tvOS)
    case .insetGrouped:
      content.listStyle(.insetGrouped)
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
    if let style = style {
      style.apply(to: content)
    } else {
      content
    }
  }
}
