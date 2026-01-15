import ExpoModulesCore
import UIKit

public enum GlassStyle: String, Enumerable {
  case clear
  case regular

  #if compiler(>=6.2) // Xcode 26
  @available(iOS 26.0, tvOS 26.0, macOS 26.0, *)
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

internal enum GlassColorScheme: String, Enumerable {
  case auto
  case light
  case dark

  func toUIUserInterfaceStyle() -> UIUserInterfaceStyle {
    switch self {
    case .auto:
      return .unspecified
    case .light:
      return .light
    case .dark:
      return .dark
    }
  }
}
