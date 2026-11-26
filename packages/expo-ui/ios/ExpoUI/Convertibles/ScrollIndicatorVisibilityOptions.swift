import ExpoModulesCore
import SwiftUI

internal enum ScrollIndicatorVisibilityOptions: String, Enumerable {
  case automatic
  case visible
  case hidden
  case never

  func toVisibility() -> ScrollIndicatorVisibility {
    switch self {
    case .automatic:
      return .automatic
    case .visible:
      return .visible
    case .hidden:
      return .hidden
    case .never:
      return .never
    }
  }
}
