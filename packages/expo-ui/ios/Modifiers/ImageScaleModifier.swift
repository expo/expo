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

internal struct ImageScaleModifier: ViewModifier, Record {
  @Field var scale: ImageScaleType = .medium

  func body(content: Content) -> some View {
    content.imageScale(scale.toNativeImageScale())
  }
}
