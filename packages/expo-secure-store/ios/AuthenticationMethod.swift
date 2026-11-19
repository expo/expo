import ExpoModulesCore
import Security

// Reads search the keychain in case order, so unauthenticated items are found without a prompt.
enum AuthenticationMethod: String, Enumerable {
  case none
  case biometry
  case deviceCredentials

  var serviceSuffix: String {
    switch self {
    case .none:
      return "no-auth"
    case .biometry:
      return "auth"
    case .deviceCredentials:
      return "auth-deviceCredentials"
    }
  }

  var accessControlFlags: SecAccessControlCreateFlags? {
    switch self {
    case .none:
      return nil
    case .biometry:
      return .biometryCurrentSet
    case .deviceCredentials:
      return .userPresence
    }
  }
}
