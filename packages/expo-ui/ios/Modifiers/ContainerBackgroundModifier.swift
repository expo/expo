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

#if !os(tvOS)
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
#if !os(tvOS)
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
#else
    content
#endif
  }
}
