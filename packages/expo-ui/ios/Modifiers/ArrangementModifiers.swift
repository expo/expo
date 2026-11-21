// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ArrangementViewStyleOptions: String, Enumerable {
  case automatic
  case split
  case overlay
}

@MainActor @AnyViewBuilder
internal func arrangementViewStyleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let style: ArrangementViewStyleOptions = try p.value("style", .automatic)
  let axes: AxisOptions? = try p.value("axes", nil)
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

@MainActor @AnyViewBuilder
internal func splitArrangementLayoutRatioModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let ratio: CGFloat? = try p.value("ratio", nil)
  let minHorizontal: CGFloat? = try p.value("minHorizontal", nil)
  let idealHorizontal: CGFloat? = try p.value("idealHorizontal", nil)
  let maxHorizontal: CGFloat? = try p.value("maxHorizontal", nil)
  let minVertical: CGFloat? = try p.value("minVertical", nil)
  let idealVertical: CGFloat? = try p.value("idealVertical", nil)
  let maxVertical: CGFloat? = try p.value("maxVertical", nil)
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

@MainActor @AnyViewBuilder
internal func splitArrangementLayoutSizeModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let minWidth: CGFloat? = try p.value("minWidth", nil)
  let idealWidth: CGFloat? = try p.value("idealWidth", nil)
  let maxWidth: CGFloat? = try p.value("maxWidth", nil)
  let minHeight: CGFloat? = try p.value("minHeight", nil)
  let idealHeight: CGFloat? = try p.value("idealHeight", nil)
  let maxHeight: CGFloat? = try p.value("maxHeight", nil)
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

@MainActor @AnyViewBuilder
internal func splitArrangementFixedLayoutSizeModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let horizontal: Bool = try p.value("horizontal", true)
  let vertical: Bool = try p.value("vertical", true)
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

internal enum OverlayArrangementEdgeOptions: String, Enumerable {
  case top
  case bottom
  case leading
  case trailing
}

@MainActor @AnyViewBuilder
internal func overlayArrangementEdgeModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let edge: OverlayArrangementEdgeOptions = try p.value("edge", .trailing)
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
