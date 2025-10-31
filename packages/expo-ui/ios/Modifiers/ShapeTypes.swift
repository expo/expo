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
  cornerSize: Int?,
  style: RoundedCornerStyle?
) -> RoundedRectangle {
  if let style = style {
    switch style {
    case .continuous:
      if let cornerSize = cornerSize {
        return RoundedRectangle(cornerSize: CGSize(width: cornerSize, height: cornerSize), style: .continuous)
      } else {
        return RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
      }
    case .circular:
      if let cornerSize = cornerSize {
        return RoundedRectangle(cornerSize: CGSize(width: cornerSize, height: cornerSize), style: .circular)
      } else {
        return RoundedRectangle(cornerRadius: cornerRadius, style: .circular)
      }
    }
  } else {
    if let cornerSize = cornerSize {
      return RoundedRectangle(cornerSize: CGSize(width: cornerSize, height: cornerSize))
    } else {
      return RoundedRectangle(cornerRadius: cornerRadius)
    }
  }
}
