import AuthenticationServices
import ExpoModulesCore

enum FullNameFormatStyle: String, Enumerable {
  case `default`
  case short
  case medium
  case long
  case abbreviated
  
  func toFullNameFormatStyle() -> PersonNameComponentsFormatter.Style {
    switch self {
    case .default:
      return .default
    case .short:
      return .short
    case .medium:
      return .medium
    case .long:
      return .long
    case .abbreviated:
      return .abbreviated
    }
  }
}
