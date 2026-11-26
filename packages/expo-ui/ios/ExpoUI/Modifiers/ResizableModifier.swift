// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ResizingModeOptions: String, Enumerable {
  case stretch
  case tile

  var toResizingMode: Image.ResizingMode {
    switch self {
    case .stretch: return .stretch
    case .tile: return .tile
    }
  }
}

internal struct ResizableModifier: Record {
  @Field var top: CGFloat = 0
  @Field var leading: CGFloat = 0
  @Field var bottom: CGFloat = 0
  @Field var trailing: CGFloat = 0
  @Field var resizingMode: ResizingModeOptions = .stretch
}
