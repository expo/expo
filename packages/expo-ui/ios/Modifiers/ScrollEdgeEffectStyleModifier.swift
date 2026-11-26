// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ScrollEdgeEffectStyleOptions: String, UIEnum {
  case automatic
  case hard
  case soft
}

@MainActor @AnyViewBuilder
internal func scrollEdgeEffectStyleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let style: ScrollEdgeEffectStyleOptions = try p.value("style", .automatic)
  let edges: EdgeOptions = try p.value("edges", .all)
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
