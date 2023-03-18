import AuthenticationServices
import ExpoModulesCore

enum ButtonType: Int, Enumerable {
  case signIn = 0
  case `continue` = 1
  case signUp = 2

  func toAppleAuthButtonType() -> ASAuthorizationAppleIDButton.ButtonType {
    return ASAuthorizationAppleIDButton.ButtonType(rawValue: self.rawValue) ?? .signIn
  }
}
