// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal enum FullscreenOrientation: String, Enumerable {
  case landscape
  case portrait
  case landscapeLeft
  case landscapeRight
  case portraitUp
  case portraitDown
  case `default`

  func toUIInterfaceOrientationMask() -> UIInterfaceOrientationMask {
    switch self {
    case .landscape:
      return .landscape
    case .portrait:
      return [.portrait, .portraitUpsideDown]
    case .landscapeLeft:
      return .landscapeLeft
    case .landscapeRight:
      return .landscapeRight
    case .portraitUp:
      return .portrait
    case .portraitDown:
      return .portraitUpsideDown
    case .default:
      return .all
    }
  }
}
