// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ForegroundStyleType: String, Enumerable {
  case color
  case hierarchical
  case linearGradient
  case radialGradient
  case angularGradient
}

internal enum ForegroundHierarchicalStyleType: String, Enumerable {
  case primary
  case secondary
  case tertiary
  case quaternary
  case quinary
}

internal struct ForegroundStyleModifier: ViewModifier, Record {
  @Field var styleType: ForegroundStyleType = .color
  @Field var hierarchicalStyle: ForegroundHierarchicalStyleType = .primary
  @Field var color: Color?
  @Field var colors: [Color]?
  @Field var startPoint: UnitPoint?
  @Field var endPoint: UnitPoint?
  @Field var center: UnitPoint?
  @Field var startRadius: CGFloat?
  @Field var endRadius: CGFloat?

  func body(content: Content) -> some View {
    applyForegroundStyle(self, to: content)
  }
}

@ViewBuilder
internal func applyForegroundStyle<V: View>(_ modifier: ForegroundStyleModifier, to content: V) -> some View {
  switch modifier.styleType {
  case .color:
    if let color = modifier.color {
      content.foregroundStyle(color)
    } else {
      content
    }
  case .hierarchical:
    switch modifier.hierarchicalStyle {
    case .primary:
      content.foregroundStyle(.primary)
    case .secondary:
      content.foregroundStyle(.secondary)
    case .tertiary:
      content.foregroundStyle(.tertiary)
    case .quaternary:
      content.foregroundStyle(.quaternary)
    case .quinary:
      if #available(iOS 16.0, tvOS 17.0, *) {
        content.foregroundStyle(.quinary)
      } else {
        content
      }
    }
  case .linearGradient:
    if let colors = modifier.colors, let startPoint = modifier.startPoint, let endPoint = modifier.endPoint {
      content.foregroundStyle(LinearGradient(colors: colors, startPoint: startPoint, endPoint: endPoint))
    } else {
      content
    }
  case .radialGradient:
    if let colors = modifier.colors, let center = modifier.center,
       let startRadius = modifier.startRadius, let endRadius = modifier.endRadius {
      content.foregroundStyle(RadialGradient(colors: colors, center: center, startRadius: startRadius, endRadius: endRadius))
    } else {
      content
    }
  case .angularGradient:
    if let colors = modifier.colors, let center = modifier.center {
      content.foregroundStyle(AngularGradient(colors: colors, center: center))
    } else {
      content
    }
  }
}

@available(iOS 17.0, tvOS 17.0, *)
internal func applyForegroundStyle(_ modifier: ForegroundStyleModifier, to text: Text) -> Text {
  switch modifier.styleType {
  case .color:
    if let color = modifier.color {
      return text.foregroundStyle(color)
    }
    return text
  case .hierarchical:
    switch modifier.hierarchicalStyle {
    case .primary:
      return text.foregroundStyle(.primary)
    case .secondary:
      return text.foregroundStyle(.secondary)
    case .tertiary:
      return text.foregroundStyle(.tertiary)
    case .quaternary:
      return text.foregroundStyle(.quaternary)
    case .quinary:
      return text.foregroundStyle(.quinary)
    }
  case .linearGradient:
    if let colors = modifier.colors, let startPoint = modifier.startPoint, let endPoint = modifier.endPoint {
      return text.foregroundStyle(LinearGradient(colors: colors, startPoint: startPoint, endPoint: endPoint))
    }
    return text
  case .radialGradient:
    if let colors = modifier.colors, let center = modifier.center,
       let startRadius = modifier.startRadius, let endRadius = modifier.endRadius {
      return text.foregroundStyle(RadialGradient(colors: colors, center: center, startRadius: startRadius, endRadius: endRadius))
    }
    return text
  case .angularGradient:
    if let colors = modifier.colors, let center = modifier.center {
      return text.foregroundStyle(AngularGradient(colors: colors, center: center))
    }
    return text
  }
}
