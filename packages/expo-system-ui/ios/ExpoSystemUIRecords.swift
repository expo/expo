import ExpoModulesCore

enum Theme: String, Enumerable {
  case light = "light"
  case dark = "dark"
  case auto = "auto"
  
  func toUserInterfaceStyle() -> UIUserInterfaceStyle {
    switch self {
    case .dark:
      return .dark
    case .light:
      return .light
    case .auto:
      return .unspecified
    default:
      return .light
    }
  }
}
