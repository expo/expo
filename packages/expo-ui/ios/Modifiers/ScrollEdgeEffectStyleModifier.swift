// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ScrollEdgeEffectStyleOptions: String, Enumerable {
  case automatic
  case hard
  case soft
}

internal struct ScrollEdgeEffectStyleModifier: ViewModifier, Record {
  @Field var style: ScrollEdgeEffectStyleOptions = .automatic
  @Field var edges: EdgeOptions = .all

  func body(content: Content) -> some View {
#if compiler(>=6.2) && !os(tvOS) && !os(macOS) // Xcode 26
    if #available(iOS 26.0, *) {
      switch style {
      case .automatic:
        content.scrollEdgeEffectStyle(.automatic, for: edges.toEdge())
      case .hard:
        content.scrollEdgeEffectStyle(.hard, for: edges.toEdge())
      case .soft:
        content.scrollEdgeEffectStyle(.soft, for: edges.toEdge())
      }
    } else {
      content
    }
#else
    content
#endif
  }
}
