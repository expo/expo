import ExpoModulesCore
import UIKit

public enum GlassStyle: String, Enumerable {
  case clear
  case regular

  @available(iOS 26.0, *)
  #if compiler(>=6.2) // Xcode 26
  func toUIGlassEffectStyle() -> UIGlassEffect.Style {
    switch self {
    case .clear:
      return .clear
    case .regular:
      return .regular
    }
  }
  #endif
}
