import ExpoModulesCore

enum Theme: String, Enumerable {
  case light
  case dark
  case auto

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
