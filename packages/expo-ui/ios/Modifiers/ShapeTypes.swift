// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ShapeType: String, Enumerable {
  case capsule
  case circle
  case containerRelativeShape
  case ellipse
  case rectangle
  case roundedRectangle
  case unevenRoundedRectangle
}

internal enum RoundedCornerStyle: String, Enumerable {
  case continuous
  case circular
}

internal struct CornerSize: Record {
  @Field var width: Int = 0
  @Field var height: Int = 0
}

internal struct CornerRadii: Record {
  @Field var topLeading: CGFloat = 0
  @Field var topTrailing: CGFloat = 0
  @Field var bottomLeading: CGFloat = 0
  @Field var bottomTrailing: CGFloat = 0
}

// MARK: - Stroke Style

internal enum StrokeLineCap: String, Enumerable {
  case butt
  case round
  case square

  func toCGLineCap() -> CGLineCap {
    switch self {
    case .butt: return .butt
    case .round: return .round
    case .square: return .square
    }
  }
}

internal enum StrokeLineJoin: String, Enumerable {
  case miter
  case round
  case bevel

  func toCGLineJoin() -> CGLineJoin {
    switch self {
    case .miter: return .miter
    case .round: return .round
    case .bevel: return .bevel
    }
  }
}

internal struct StrokeStyleConfig: Record {
  @Field var lineWidth: CGFloat = 1
  @Field var lineCap: StrokeLineCap = .butt
  @Field var lineJoin: StrokeLineJoin = .miter
  @Field var miterLimit: CGFloat = 10
  @Field var dash: [CGFloat] = []
  @Field var dashPhase: CGFloat = 0

  func toStrokeStyle() -> StrokeStyle {
    return StrokeStyle(
      lineWidth: lineWidth,
      lineCap: lineCap.toCGLineCap(),
      lineJoin: lineJoin.toCGLineJoin(),
      miterLimit: miterLimit,
      dash: dash,
      dashPhase: dashPhase
    )
  }
}

// MARK: - Shape Helper Functions

internal func makeCapsule(style: RoundedCornerStyle?) -> Capsule {
  if let style = style {
    switch style {
    case .continuous:
      return Capsule(style: .continuous)
    case .circular:
      return Capsule(style: .circular)
    }
  }
  return Capsule()
}

internal func makeRoundedRectangle(
  cornerRadius: CGFloat,
  cornerSize: CornerSize?,
  style: RoundedCornerStyle?
) -> RoundedRectangle {
  if let style = style {
    switch style {
    case .continuous:
      if let cornerSize {
        return RoundedRectangle(cornerSize: CGSize(width: cornerSize.width, height: cornerSize.height), style: .continuous)
      }
      return RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
    case .circular:
      if let cornerSize {
        return RoundedRectangle(cornerSize: CGSize(width: cornerSize.width, height: cornerSize.height), style: .circular)
      }
      return RoundedRectangle(cornerRadius: cornerRadius, style: .circular)
    }
  } else {
    if let cornerSize {
      return RoundedRectangle(cornerSize: CGSize(width: cornerSize.width, height: cornerSize.height))
    }
    return RoundedRectangle(cornerRadius: cornerRadius)
  }
}

internal func makeUnevenRoundedRectangle(
  cornerRadii: CornerRadii?,
  style: RoundedCornerStyle?
) -> UnevenRoundedRectangle {
  return UnevenRoundedRectangle(
    cornerRadii: RectangleCornerRadii(
      topLeading: cornerRadii?.topLeading ?? 0,
      bottomLeading: cornerRadii?.bottomLeading ?? 0,
      bottomTrailing: cornerRadii?.bottomTrailing ?? 0,
      topTrailing: cornerRadii?.topTrailing ?? 0
    ),
    // Matches `makeRoundedRectangle`, whose `RoundedRectangle` defaults to circular corners.
    style: style == .continuous ? .continuous : .circular
  )
}
