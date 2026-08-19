import AuthenticationServices
import ExpoModulesCore

final class InvalidScopeException: GenericException<Int>, @unchecked Sendable {
  override var reason: String {
    "Invalid Apple authentication scope: \(param)"
  }
}

final class InvalidOperationException: GenericException<Int>, @unchecked Sendable {
  override var reason: String {
    "Invalid type of Apple authentication operation: \(param)"
  }
}

final class RequestCanceledException: Exception, @unchecked Sendable {
  override var reason: String {
    "The user canceled the authorization attempt"
  }
}

final class InvalidResponseException: Exception, @unchecked Sendable {
  override var reason: String {
    "The authorization request received an invalid response"
  }
}

final class RequestNotHandledException: Exception, @unchecked Sendable {
  override var reason: String {
    "The authorization request wasn’t handled"
  }
}

final class RequestFailedException: Exception, @unchecked Sendable {
  override var reason: String {
    "The authorization attempt failed"
  }
}

final class RequestNotInteractiveException: Exception, @unchecked Sendable {
  override var reason: String {
    "The authorization request isn’t interactive"
  }
}

final class RequestUnknownException: Exception, @unchecked Sendable {
  override var reason: String {
    "The authorization attempt failed for an unknown reason"
  }
}

final class RequestMatchedExcludedCredentialException: Exception, @unchecked Sendable {
  override var reason: String {
    "This request matched an excluded credential"
  }
}

final class WindowUnavailableException: Exception, @unchecked Sendable {
  override var reason: String {
    "Couldn't present the Sign in with Apple sheet because no active window is available"
  }
}

func exceptionForAuthorizationError(_ error: ASAuthorizationError) -> Exception {
  switch error.code {
  case .unknown:
    return RequestUnknownException()
  case .canceled:
    return RequestCanceledException()
  case .invalidResponse:
    return InvalidResponseException()
  case .notHandled:
    return RequestNotHandledException()
  case .failed:
    return RequestFailedException()
  case .notInteractive:
    return RequestNotInteractiveException()
  #if compiler(>=6)
  case .matchedExcludedCredential:
    return RequestMatchedExcludedCredentialException()
  #endif
  @unknown default:
    return RequestUnknownException()
  }
}
