// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum SearchToolbarBehaviorType: String, Enumerable {
  case automatic
  case minimize
}

internal struct SearchToolbarBehaviorModifier: ViewModifier, Record {
  @Field var behavior: SearchToolbarBehaviorType = .automatic

  @ViewBuilder
  func body(content: Content) -> some View {
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
}
