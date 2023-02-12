import AuthenticationServices
import ABI48_0_0ExpoModulesCore

enum ButtonStyle: Int, Enumerable {
  case white = 0
  case whiteOutline = 1
  case black = 2

  func toAppleAuthButtonStyle() -> ASAuthorizationAppleIDButton.Style {
    return ASAuthorizationAppleIDButton.Style(rawValue: self.rawValue) ?? .white
  }
}
