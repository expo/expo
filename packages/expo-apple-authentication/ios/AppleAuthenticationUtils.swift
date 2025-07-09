import AuthenticationServices
import ExpoModulesCore

func credentialStateToInt(_ credentialState: ASAuthorizationAppleIDProvider.CredentialState) -> Int {
  switch credentialState {
  case .revoked:
    return 0
  case .authorized:
    return 1
  case .notFound:
    return 2
  case .transferred:
    return 3
  @unknown default:
    log.error("Unhandled `ASAuthorizationAppleIDProvider.CredentialState` value: \(credentialState), returning `notFound` as fallback. Add the missing case as soon as possible.")
    return 2
  }
}

func realUserStatusToInt(_ status: ASUserDetectionStatus?) -> Int {
  switch status {
  case .unknown:
    return 1
  case .likelyReal:
    return 2
  case .unsupported, .none:
    return 3
  @unknown default:
    log.error("Unhandled `ASUserDetectionStatus` value: \(String(describing: status)), returning `unsupported` as fallback. Add the missing case as soon as possible.")
    return 3
  }
}

func scopeFromInt(_ scope: Int) throws -> ASAuthorization.Scope {
  switch scope {
  case 0:
    return .fullName
  case 1:
    return .email
  default:
    throw InvalidScopeException(scope)
  }
}

func scopesFromInts(_ ints: [Int]?) throws -> [ASAuthorization.Scope]? {
  return try ints?.map(scopeFromInt(_:))
}

func operationFromInt(_ int: Int) throws -> ASAuthorization.OpenIDOperation {
  switch int {
  case 0:
    return .operationImplicit
  case 1:
    return .operationLogin
  case 2:
    return .operationRefresh
  case 3:
    return .operationLogout
  default:
    throw InvalidOperationException(int)
  }
}

func nameComponentsToDict(_ nameComponents: PersonNameComponents?) -> [String: Any] {
  return [
    "namePrefix": nameComponents?.namePrefix,
    "nameSuffix": nameComponents?.nameSuffix,
    "givenName": nameComponents?.givenName,
    "middleName": nameComponents?.middleName,
    "familyName": nameComponents?.familyName,
    "nickname": nameComponents?.nickname
  ]
}

func dataToString(_ data: Data?) -> String? {
  if let data {
    return String(data: data, encoding: .utf8)
  } else {
    return nil
  }
}
