// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ScrollTargetBehaviorType: String, Enumerable {
  case paging
  case viewAligned
}

internal struct ScrollTargetBehaviorModifier: ViewModifier, Record {
  @Field var behavior: ScrollTargetBehaviorType = .paging

  func body(content: Content) -> some View {
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
}
