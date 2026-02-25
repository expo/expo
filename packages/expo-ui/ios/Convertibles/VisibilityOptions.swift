import ExpoModulesCore
import SwiftUI

internal enum VisibilityOptions: String, Enumerable {
  case automatic
  case visible
  case hidden

  func toVisibility() -> Visibility {
    switch self {
    case .automatic:
      return .automatic
    case .visible:
      return .visible
    case .hidden:
      return .hidden
    }
  }
}
