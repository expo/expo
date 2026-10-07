// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ArrangementViewStyleOptions: String, Enumerable {
  case automatic
  case split
  case overlay
}

internal struct ArrangementViewStyleModifier: ViewModifier, Record {
  @Field var style: ArrangementViewStyleOptions = .automatic
  @Field var axes: AxisOptions?

  @ViewBuilder
  func body(content: Content) -> some View {
#if canImport(SwiftUICore, _version: 8.0.85)
    if #available(iOS 27.1, macOS 27.1, tvOS 27.1, visionOS 27.1, *) {
      switch style {
      case .automatic:
        content.arrangementViewStyle(.automatic)
      case .split:
        if let axes {
          content.arrangementViewStyle(.split.axes(axes.toAxis()))
        } else {
          content.arrangementViewStyle(.split)
        }
      case .overlay:
        if let axes {
          content.arrangementViewStyle(.overlay.axes(axes.toAxis()))
        } else {
          content.arrangementViewStyle(.overlay)
        }
      }
    } else {
      content
    }
#else
    content
#endif
  }
}

internal struct SplitArrangementLayoutRatioModifier: ViewModifier, Record {
  @Field var ratio: CGFloat?
  @Field var minHorizontal: CGFloat?
  @Field var idealHorizontal: CGFloat?
  @Field var maxHorizontal: CGFloat?
  @Field var minVertical: CGFloat?
  @Field var idealVertical: CGFloat?
  @Field var maxVertical: CGFloat?

  @ViewBuilder
  func body(content: Content) -> some View {
#if canImport(SwiftUICore, _version: 8.0.85)
    if #available(iOS 27.1, macOS 27.1, tvOS 27.1, visionOS 27.1, *) {
      if let ratio {
        content.splitArrangementLayoutRatio(ratio)
      } else {
        content.splitArrangementLayoutRatio(
          minHorizontal: minHorizontal,
          idealHorizontal: idealHorizontal,
          maxHorizontal: maxHorizontal,
          minVertical: minVertical,
          idealVertical: idealVertical,
          maxVertical: maxVertical
        )
      }
    } else {
      content
    }
#else
    content
#endif
  }
}

internal struct SplitArrangementLayoutSizeModifier: ViewModifier, Record {
  @Field var minWidth: CGFloat?
  @Field var idealWidth: CGFloat?
  @Field var maxWidth: CGFloat?
  @Field var minHeight: CGFloat?
  @Field var idealHeight: CGFloat?
  @Field var maxHeight: CGFloat?

  @ViewBuilder
  func body(content: Content) -> some View {
#if canImport(SwiftUICore, _version: 8.0.85)
    if #available(iOS 27.1, macOS 27.1, tvOS 27.1, visionOS 27.1, *) {
      content.splitArrangementLayoutSize(
        minWidth: minWidth,
        idealWidth: idealWidth,
        maxWidth: maxWidth,
        minHeight: minHeight,
        idealHeight: idealHeight,
        maxHeight: maxHeight
      )
    } else {
      content
    }
#else
    content
#endif
  }
}

internal struct SplitArrangementFixedLayoutSizeModifier: ViewModifier, Record {
  @Field var horizontal: Bool = true
  @Field var vertical: Bool = true

  @ViewBuilder
  func body(content: Content) -> some View {
#if canImport(SwiftUICore, _version: 8.0.85)
    if #available(iOS 27.1, macOS 27.1, tvOS 27.1, visionOS 27.1, *) {
      content.splitArrangementFixedLayoutSize(horizontal: horizontal, vertical: vertical)
    } else {
      content
    }
#else
    content
#endif
  }
}

internal enum OverlayArrangementEdgeOptions: String, Enumerable {
  case top
  case bottom
  case leading
  case trailing
}

internal struct OverlayArrangementEdgeModifier: ViewModifier, Record {
  @Field var edge: OverlayArrangementEdgeOptions = .trailing

  @ViewBuilder
  func body(content: Content) -> some View {
#if canImport(SwiftUICore, _version: 8.0.85)
    if #available(iOS 27.1, macOS 27.1, tvOS 27.1, visionOS 27.1, *) {
      switch edge {
      case .top:
        content.overlayArrangementEdge(VerticalEdge.top)
      case .bottom:
        content.overlayArrangementEdge(VerticalEdge.bottom)
      case .leading:
        content.overlayArrangementEdge(HorizontalEdge.leading)
      case .trailing:
        content.overlayArrangementEdge(HorizontalEdge.trailing)
      }
    } else {
      content
    }
#else
    content
#endif
  }
}
