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

@MainActor @AnyViewBuilder
internal func listStyleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let style: ListStyleType? = try p.value("style", nil)
  if let style {
    style.apply(to: content)
  } else {
    content
  }
}
