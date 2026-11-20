// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ScrollTargetBehaviorType: String, Enumerable {
  case paging
  case viewAligned
}

@MainActor @AnyViewBuilder
internal func scrollTargetBehaviorModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let behavior: ScrollTargetBehaviorType = try p.value("behavior", .paging)
  if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
    switch behavior {
    case .viewAligned:
      content.scrollTargetBehavior(.viewAligned)
    case .paging:
      content.scrollTargetBehavior(.paging)
    }
  } else {
    content
  }
}
