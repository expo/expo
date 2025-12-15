// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum AlignmentOptions: String, Enumerable {
  case center
  case leading
  case trailing
  case top
  case bottom
  case topLeading
  case topTrailing
  case bottomLeading
  case bottomTrailing

  case centerFirstTextBaseline
  case centerLastTextBaseline
  case leadingFirstTextBaseline
  case leadingLastTextBaseline
  case trailingFirstTextBaseline
  case trailingLastTextBaseline

  func toAlignment() -> SwiftUI.Alignment {
    switch self {
    case .center:
      return .center
    case .leading:
      return .leading
    case .trailing:
      return .trailing
    case .top:
      return .top
    case .bottom:
      return .bottom
    case .topLeading:
      return .topLeading
    case .topTrailing:
      return .topTrailing
    case .bottomLeading:
      return .bottomLeading
    case .bottomTrailing:
      return .bottomTrailing
    case .centerFirstTextBaseline:
      return .centerFirstTextBaseline
    case .centerLastTextBaseline:
      return .centerLastTextBaseline
    case .leadingFirstTextBaseline:
      return .leadingFirstTextBaseline
    case .leadingLastTextBaseline:
      return .leadingLastTextBaseline
    case .trailingFirstTextBaseline:
      return .trailingFirstTextBaseline
    case .trailingLastTextBaseline:
      return .trailingLastTextBaseline
    }
  }
}
