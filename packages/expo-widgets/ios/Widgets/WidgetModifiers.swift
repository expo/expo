// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import ExpoUI
import SwiftUI
#if !os(tvOS)
import WidgetKit
#endif

internal enum WidgetAccentedRenderingModeOptions: String, Enumerable {
  case accented
  case desaturated
  case accentedDesaturated
  case fullColor

#if !os(tvOS)
  @available(iOS 18.0, macOS 15.0, *)
  var toWidgetAccentedRenderingMode: WidgetAccentedRenderingMode {
    switch self {
    case .accented: return .accented
    case .accentedDesaturated: return .accentedDesaturated
    case .desaturated: return .desaturated
    case .fullColor: return .fullColor
    }
  }
#endif
}

/**
 * This is a unique modifier that exists only on Image, but returns some View, and for this reason it cannot be a ViewModifier.
 */
internal struct WidgetAccentedRenderingModeModifier: Record {
  @Field var renderingMode: WidgetAccentedRenderingModeOptions?

  @ViewBuilder
  func apply(to image: Image) -> some View {
#if !os(tvOS)
    if #available(iOS 18.0, macOS 15.0, *), renderingMode != nil {
      image.widgetAccentedRenderingMode(renderingMode?.toWidgetAccentedRenderingMode)
    } else {
      image
    }
#else
    image
#endif
  }
}

internal struct WidgetURLModifier: ViewModifier, Record {
  @Field var url: URL?

  func body(content: Content) -> some View {
#if !os(tvOS)
    content.widgetURL(url)
#else
    content
#endif
  }
}

internal struct ActivityBackgroundTintModifier: ViewModifier, Record {
  @Field var color: Color?

  func body(content: Content) -> some View {
#if !os(tvOS) && !os(macOS) && !targetEnvironment(macCatalyst)
    content.activityBackgroundTint(color)
#else
    content
#endif
  }
}

internal struct WidgetContainerBackgroundModifier: ViewModifier, Record {
  @Field var style: ShapeStyleValue?
  @Field var container: ContainerBackgroundPlacementOptions?

  func body(content: Content) -> some View {
    if let shapeStyle = style?.toAnyShapeStyle(), let container {
      if #available(iOS 18.0, *) {
        content.containerBackground(shapeStyle, for: container.toContainerBackgroundPlacement)
      } else if #available(iOS 17.0, *) {
        content.containerBackground(shapeStyle, for: .widget)
      } else {
        content
      }
    } else {
      content
    }
  }
}

private extension ContainerBackgroundPlacementOptions {
  @available(iOS 18.0, *)
  var toContainerBackgroundPlacement: ContainerBackgroundPlacement {
    switch self {
    case .widget: return .widget
    case .navigation: return .navigation
    case .navigationSplitView: return .navigationSplitView
    }
  }
}

/**
 * Registers the modifiers that need WidgetKit. They live here rather than in ExpoUI,
 * so apps that use ExpoUI without widgets do not link WidgetKit.
 * See: https://github.com/expo/expo/issues/50777
 */
internal func registerWidgetModifiers() {
  ViewModifierRegistry.register("widgetURL") { params, appContext, _ in
    return try WidgetURLModifier(from: params, appContext: appContext)
  }
  ViewModifierRegistry.register("activityBackgroundTint") { params, appContext, _ in
    return try ActivityBackgroundTintModifier(from: params, appContext: appContext)
  }
  // Replaces ExpoUI's modifier, which does not support the `widget` placement.
  ViewModifierRegistry.unregister("containerBackground")
  ViewModifierRegistry.register("containerBackground") { params, appContext, _ in
    return try WidgetContainerBackgroundModifier(from: params, appContext: appContext)
  }
  ViewModifierRegistry.widgetAccentedRenderingModeHandler = { image, params, appContext in
    guard #available(iOS 18.0, *), let modifier = try? WidgetAccentedRenderingModeModifier(from: params, appContext: appContext) else {
      return nil
    }
    return AnyView(modifier.apply(to: image))
  }
}
