import AuthenticationServices
import ExpoModulesCore

enum FullNameFormatStyle: Int, Enumerable {
  case `default` = 0
  case short = 1
  case medium = 2
  case long = 3
  case abbreviated = 4

  func toFullNameFormatStyle() -> PersonNameComponentsFormatter.Style {
    return PersonNameComponentsFormatter.Style(rawValue: self.rawValue) ?? .default
  }
}
