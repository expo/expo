import ExpoModulesCore
import SwiftUI

internal enum AxisOptions: String, Enumerable {
  case horizontal
  case vertical
  case both

  func toAxis() -> Axis.Set {
    switch self {
    case .vertical:
      return .vertical
    case .horizontal:
      return .horizontal
    case .both:
      return [.vertical, .horizontal]
    }
  }
}
