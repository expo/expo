// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ContainerBackgroundPlacementOptions: String, Enumerable {
  case widget
  case navigation
  case navigationSplitView

#if !os(tvOS) && !os(macOS)
  // `widget` is declared in WidgetKit, so expo-widgets applies it through `ViewModifierRegistry.widgetKit`.
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
    if let shapeStyle = style?.toAnyShapeStyle(), let container {
      if container == .widget, let widgetKit = ViewModifierRegistry.widgetKit {
        widgetKit.containerBackground(AnyView(content), style: shapeStyle)
      } else if #available(iOS 18.0, *), let placement = container.toContainerBackgroundPlacement {
        content.containerBackground(shapeStyle, for: placement)
      } else if let widgetKit = ViewModifierRegistry.widgetKit {
        // On iOS 17, the other placements fall back to `widget`.
        widgetKit.containerBackground(AnyView(content), style: shapeStyle)
      } else {
        content
      }
    } else {
      content
    }
#endif
  }

#if DEBUG
  private static var didWarnAboutWidgetPlacement = false

  func warnIfWidgetPlacementIsUnavailable() {
    guard container == .widget, ViewModifierRegistry.widgetKit == nil, !Self.didWarnAboutWidgetPlacement else {
      return
    }
    Self.didWarnAboutWidgetPlacement = true
    log.warn("containerBackground with the 'widget' placement has no effect here, because it only applies inside widgets rendered by expo-widgets. Use the 'navigation' or 'navigationSplitView' placement in app screens.")
  }
#endif
}
