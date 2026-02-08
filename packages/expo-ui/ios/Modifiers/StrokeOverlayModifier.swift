// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

// MARK: - Stroke Style Type Enum

internal enum StrokeStyleType: String, Enumerable {
  case color
  case linearGradient
  case radialGradient
  case angularGradient
}

// MARK: - Stroke Overlay Modifier

internal struct StrokeOverlayModifier: ViewModifier, Record {
  @Field var shape: ShapeType?
  @Field var cornerRadius: CGFloat = 0
  @Field var roundedCornerStyle: RoundedCornerStyle?
  @Field var cornerSize: CornerSize?

  @Field var lineWidth: CGFloat = 1.0
  @Field var lineCap: LineCap?
  @Field var lineJoin: LineJoin?
  @Field var miterLimit: CGFloat = 10.0
  @Field var dashPattern: [CGFloat]?
  @Field var dashPhase: CGFloat = 0.0
  @Field var antialiased: Bool = true

  @Field var styleType: StrokeStyleType = .color
  @Field var color: Color?
  @Field var colors: [Color]?
  @Field var startPoint: UnitPoint?
  @Field var endPoint: UnitPoint?
  @Field var center: UnitPoint?
  @Field var startRadius: CGFloat?
  @Field var endRadius: CGFloat?

  // MARK: - Body

  @ViewBuilder
  func body(content: Content) -> some View {
    if let shapeType = shape {
      applyStroke(to: content, shapeType: shapeType)
    } else {
      content
    }
  }

  // MARK: - Private Helpers

  private func makeStrokeStyle() -> StrokeStyle {
    StrokeStyle(
      lineWidth: lineWidth,
      lineCap: lineCap?.toCGLineCap() ?? .butt,
      lineJoin: lineJoin?.toCGLineJoin() ?? .miter,
      miterLimit: miterLimit,
      dash: dashPattern ?? [],
      dashPhase: dashPhase
    )
  }

  @ViewBuilder
  private func applyStroke<V: View>(to content: V, shapeType: ShapeType) -> some View {
    let style = makeStrokeStyle()

    switch styleType {
    case .color:
      if let color = color {
        applyColorStroke(to: content, shapeType: shapeType, color: color, style: style)
      } else {
        content
      }
    case .linearGradient:
      if let colors = colors, let startPoint = startPoint, let endPoint = endPoint {
        let gradient = LinearGradient(colors: colors, startPoint: startPoint, endPoint: endPoint)
        applyGradientStroke(to: content, shapeType: shapeType, gradient: gradient, style: style)
      } else {
        content
      }
    case .radialGradient:
      if let colors = colors, let center = center, let startRadius = startRadius, let endRadius = endRadius {
        let gradient = RadialGradient(colors: colors, center: center, startRadius: startRadius, endRadius: endRadius)
        applyGradientStroke(to: content, shapeType: shapeType, gradient: gradient, style: style)
      } else {
        content
      }
    case .angularGradient:
      if let colors = colors, let center = center {
        let gradient = AngularGradient(colors: colors, center: center)
        applyGradientStroke(to: content, shapeType: shapeType, gradient: gradient, style: style)
      } else {
        content
      }
    }
  }

  @ViewBuilder
  private func applyColorStroke<V: View>(to content: V, shapeType: ShapeType, color: Color, style: StrokeStyle) -> some View {
    switch shapeType {
    case .capsule:
      content.overlay(makeCapsule(style: roundedCornerStyle).strokeBorder(color, style: style, antialiased: antialiased))
    case .circle:
      content.overlay(Circle().strokeBorder(color, style: style, antialiased: antialiased))
    case .ellipse:
      content.overlay(Ellipse().strokeBorder(color, style: style, antialiased: antialiased))
    case .rectangle:
      content.overlay(Rectangle().strokeBorder(color, style: style, antialiased: antialiased))
    case .roundedRectangle:
      content.overlay(makeRoundedRectangle(cornerRadius: cornerRadius, cornerSize: cornerSize, style: roundedCornerStyle).strokeBorder(color, style: style, antialiased: antialiased))
    }
  }

  @ViewBuilder
  private func applyGradientStroke<V: View, G: ShapeStyle>(to content: V, shapeType: ShapeType, gradient: G, style: StrokeStyle) -> some View {
    switch shapeType {
    case .capsule:
      content.overlay(makeCapsule(style: roundedCornerStyle).strokeBorder(gradient, style: style, antialiased: antialiased))
    case .circle:
      content.overlay(Circle().strokeBorder(gradient, style: style, antialiased: antialiased))
    case .ellipse:
      content.overlay(Ellipse().strokeBorder(gradient, style: style, antialiased: antialiased))
    case .rectangle:
      content.overlay(Rectangle().strokeBorder(gradient, style: style, antialiased: antialiased))
    case .roundedRectangle:
      content.overlay(makeRoundedRectangle(cornerRadius: cornerRadius, cornerSize: cornerSize, style: roundedCornerStyle).strokeBorder(gradient, style: style, antialiased: antialiased))
    }
  }
}
