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
  ViewModifierRegistry.widgetKit = WidgetKitModifiersImpl()
}

private struct WidgetKitModifiersImpl: WidgetKitModifiers {
  func containerBackground(_ view: AnyView, style: AnyShapeStyle) -> AnyView {
    guard #available(iOS 17.0, *) else {
      return view
    }
    return AnyView(view.containerBackground(style, for: .widget))
  }

  func widgetAccentedRenderingMode(_ image: Image, params: [String: Any], appContext: AppContext) -> AnyView? {
    guard #available(iOS 18.0, *), let modifier = try? WidgetAccentedRenderingModeModifier(from: params, appContext: appContext) else {
      return nil
    }
    return AnyView(modifier.apply(to: image))
  }
}
