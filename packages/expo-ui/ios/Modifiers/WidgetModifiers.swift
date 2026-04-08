// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
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
  @available(iOS 18.0, *)
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
    if #available(iOS 18.0, *), renderingMode != nil {
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

internal struct ContainerBackgroundModifier: ViewModifier, Record {
  @Field var color: Color?

  func body(content: Content) -> some View {
#if !os(tvOS)
    if #available(iOS 17.0, *), let color {
      content.containerBackground(color, for: .widget)
    } else {
      content
    }
#else
    content
#endif
  }
}

internal struct InvalidatableContentModifier: ViewModifier, Record {
  @Field var isInvalidatable: Bool?

  func body(content: Content) -> some View {
#if !os(tvOS)
    if #available(iOS 17.0, *) {
      content.invalidatableContent(isInvalidatable ?? true)
    } else {
      content
    }
#else
    content
#endif
  }
}

internal struct ContentMarginsDisabledModifier: ViewModifier, Record {
  @Field var disabled: Bool?

  func body(content: Content) -> some View {
#if !os(tvOS)
    if #available(iOS 17.0, *), disabled ?? true {
      content.contentMargins(.all, 0, for: .widget)
    } else {
      content
    }
#else
    content
#endif
  }
}

internal struct UnredactedModifier: ViewModifier, Record {
  func body(content: Content) -> some View {
    content.unredacted()
  }
}
