// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ShapeStyleType: String, Enumerable {
  case color
  case hierarchical
  case material
  case linearGradient
  case radialGradient
  case angularGradient
}

internal enum HierarchicalShapeStyleOptions: String, Enumerable {
  case primary
  case secondary
  case tertiary
  case quaternary
  case quinary

  /**
   Returns `nil` when the style is not available on the running platform.
   */
  func toShapeStyle() -> AnyShapeStyle? {
    switch self {
    case .primary:
      return AnyShapeStyle(HierarchicalShapeStyle.primary)
    case .secondary:
      return AnyShapeStyle(HierarchicalShapeStyle.secondary)
    case .tertiary:
      return AnyShapeStyle(HierarchicalShapeStyle.tertiary)
    case .quaternary:
      return AnyShapeStyle(HierarchicalShapeStyle.quaternary)
    case .quinary:
      if #available(iOS 16.0, tvOS 17.0, *) {
        return AnyShapeStyle(HierarchicalShapeStyle.quinary)
      }
      return nil
    }
  }
}

internal enum MaterialOptions: String, Enumerable {
  case ultraThin
  case thin
  case regular
  case thick
  case ultraThick
  case bar

  /**
   Returns `nil` when the material is not available on the running platform.
   */
  func toShapeStyle() -> AnyShapeStyle? {
    switch self {
    case .ultraThin:
      return AnyShapeStyle(Material.ultraThin)
    case .thin:
      return AnyShapeStyle(Material.thin)
    case .regular:
      return AnyShapeStyle(Material.regular)
    case .thick:
      return AnyShapeStyle(Material.thick)
    case .ultraThick:
      return AnyShapeStyle(Material.ultraThick)
    case .bar:
      // The bar material has no tvOS counterpart.
#if os(tvOS)
      return nil
#else
      return AnyShapeStyle(Material.bar)
#endif
    }
  }
}

/**
 A style that fills or paints an area, mirroring SwiftUI's `ShapeStyle`. Every style is erased to
 `AnyShapeStyle` because the concrete type is only known at runtime — an opaque `some ShapeStyle`
 would have to be a single type across all the branches below.
 */
internal struct ShapeStyleValue: Record {
  @Field var type: ShapeStyleType = .color
  @Field var color: Color?
  @Field var hierarchical: HierarchicalShapeStyleOptions?
  @Field var material: MaterialOptions?
  @Field var colors: [Color]?
  @Field var startPoint: UnitPoint?
  @Field var endPoint: UnitPoint?
  @Field var center: UnitPoint?
  @Field var startRadius: CGFloat?
  @Field var endRadius: CGFloat?

  /**
   Resolves the style, or returns `nil` when the fields it needs are missing or the style is not
   available on the running platform. Callers leave the view untouched in that case.
   */
  func toAnyShapeStyle() -> AnyShapeStyle? {
    switch type {
    case .color:
      guard let color else {
        return nil
      }
      return AnyShapeStyle(color)
    case .hierarchical:
      return (hierarchical ?? .primary).toShapeStyle()
    case .material:
      return material?.toShapeStyle()
    case .linearGradient:
      guard let colors, let startPoint, let endPoint else {
        return nil
      }
      return AnyShapeStyle(LinearGradient(colors: colors, startPoint: startPoint, endPoint: endPoint))
    case .radialGradient:
      guard let colors, let center, let startRadius, let endRadius else {
        return nil
      }
      return AnyShapeStyle(
        RadialGradient(colors: colors, center: center, startRadius: startRadius, endRadius: endRadius)
      )
    case .angularGradient:
      guard let colors, let center else {
        return nil
      }
      return AnyShapeStyle(AngularGradient(colors: colors, center: center))
    }
  }
}
