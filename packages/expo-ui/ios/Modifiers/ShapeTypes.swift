// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ShapeType: String, Enumerable {
  case capsule
  case circle
  case ellipse
  case rectangle
  case roundedRectangle
}

internal enum RoundedCornerStyle: String, Enumerable {
  case continuous
  case circular
}

internal struct CornerSize: Record {
  @Field var width: Int = 0
  @Field var height: Int = 0
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
