// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

public enum ContainerBackgroundPlacementOptions: String, Enumerable {
  case widget
  case navigation
  case navigationSplitView

#if !os(tvOS) && !os(macOS)
  // `widget` is declared in WidgetKit, so expo-widgets registers its own modifier for it.
  @available(iOS 18.0, *)
  var toContainerBackgroundPlacement: ContainerBackgroundPlacement? {
    switch self {
    case .widget: return nil
    case .navigation: return .navigation
    case .navigationSplitView: return .navigationSplitView
    }
  }
#endif
}

internal struct ContainerBackgroundModifier: ViewModifier, Record {
  @Field var style: ShapeStyleValue?
  @Field var container: ContainerBackgroundPlacementOptions?

  func body(content: Content) -> some View {
#if os(tvOS) || os(macOS)
    content
#else
    if #available(iOS 18.0, *), let shapeStyle = style?.toAnyShapeStyle(), let placement = container?.toContainerBackgroundPlacement {
      content.containerBackground(shapeStyle, for: placement)
    } else {
      content
    }
#endif
  }
}
