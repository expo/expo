// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

enum ImageResizeMode: String, EnumArgument {
  case cover
  case contain
  case stretch
  case `repeat`
  case center

  func toContentMode() -> UIView.ContentMode {
    switch self {
    case .cover:
      return .scaleAspectFill
    case .contain:
      return .scaleAspectFit
    case .stretch, .repeat:
      return .scaleToFill
    case .center:
      return .center
    }
  }
}
