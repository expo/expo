// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum SearchToolbarBehaviorType: String, Enumerable {
  case automatic
  case minimize
}

@MainActor @AnyViewBuilder
internal func searchToolbarBehaviorModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let behavior: SearchToolbarBehaviorType = try p.value("behavior", .automatic)
  if #available(iOS 26.0, macOS 26.0, tvOS 26.0, *) {
#if compiler(>=6.2) // Xcode 26
    switch behavior {
    case .automatic:
      content.searchToolbarBehavior(.automatic)
    case .minimize:
#if os(macOS) || os(tvOS)
      content.searchToolbarBehavior(.automatic)
#else
      content.searchToolbarBehavior(.minimize)
#endif
    }
#else
    content
#endif
  } else {
    content
  }
}
