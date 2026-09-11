// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI
#if !os(tvOS)
import WidgetKit
#endif

internal enum ContainerBackgroundPlacementOptions: String, Enumerable {
  case widget
  case navigation
  case navigationSplitView

// `.navigation` and `.navigationSplitView` are unavailable on macOS, which only defines the
// `.widget` placement. macOS handles the mapping inline in `body` instead.
#if !os(tvOS) && !os(macOS)
  @available(iOS 18.0, *)
  var toContainerBackgroundPlacement: ContainerBackgroundPlacement {
    switch self {
    case .widget: return .widget
    case .navigation: return .navigation
    case .navigationSplitView: return .navigationSplitView
    }
  }
#endif
}

internal struct ContainerBackgroundModifier: ViewModifier, Record {
  @Field var color: Color?
  @Field var container: ContainerBackgroundPlacementOptions?

  func body(content: Content) -> some View {
#if os(tvOS)
    content
#elseif os(macOS)
    // `.widget` is the only placement macOS defines; the other two are unavailable there.
    if let color, container == .widget {
      content.containerBackground(color, for: .widget)
    } else {
      content
    }
#else
    if let color, let container {
      if #available(iOS 18.0, *) {
        content.containerBackground(color, for: container.toContainerBackgroundPlacement)
      } else if #available(iOS 17.0, *) {
        content.containerBackground(color, for: .widget)
      } else {
        content
      }
    } else {
      content
    }
#endif
  }
}
