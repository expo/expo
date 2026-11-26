// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum EdgeOptions: String, Enumerable {
  case all
  case top
  case bottom
  case leading
  case trailing
  case horizontal
  case vertical

  func toEdge() -> Edge.Set {
    switch self {
    case .all:
      return .all
    case .top:
      return .top
    case .bottom:
      return .bottom
    case .leading:
      return .leading
    case .trailing:
      return .trailing
    case .horizontal:
      return .horizontal
    case .vertical:
      return .vertical
    }
  }
}
