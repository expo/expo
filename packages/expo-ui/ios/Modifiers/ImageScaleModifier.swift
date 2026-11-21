// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ImageScaleType: String, Enumerable {
  case small
  case medium
  case large

  func toNativeImageScale() -> Image.Scale {
    switch self {
    case .small:
      return .small
    case .medium:
      return .medium
    case .large:
      return .large
    }
  }
}

@MainActor @AnyViewBuilder
internal func imageScaleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let scale: ImageScaleType = try p.value("scale", .medium)
  content.imageScale(scale.toNativeImageScale())
}
