import AuthenticationServices
import ExpoModulesCore

// A set of pending requests used to retain them until the callback is called
var pendingRequests = Set<AppleAuthenticationRequest>()

final class AppleAuthenticationRequest: NSObject, ASAuthorizationControllerPresentationContextProviding, ASAuthorizationControllerDelegate {
  typealias AuthenticationResponse = [AnyHashable: Any]
  typealias AuthenticationRequestCallback = (AuthenticationResponse?, Exception?) -> Void

  let options: AppleAuthenticationRequestOptions
  var callback: AuthenticationRequestCallback?
  var authController: ASAuthorizationController?

  init(options: AppleAuthenticationRequestOptions) {
    self.options = options
  }

  func performRequest(callback: @escaping AuthenticationRequestCallback) {
    self.callback = callback

    do {
      let appleIdProvider = ASAuthorizationAppleIDProvider()
      let request = appleIdProvider.createRequest()

      request.requestedScopes = try scopesFromInts(options.requestedScopes)
      request.requestedOperation = try operationFromInt(options.requestedOperation)

      request.user = options.user
      request.state = options.state
      request.nonce = options.nonce

      authController = ASAuthorizationController(authorizationRequests: [request])
      authController?.presentationContextProvider = self
      authController?.delegate = self

      // Retain pending request
      pendingRequests.insert(self)

      authController?.performRequests()
    } catch {
      self.callback?(nil, error as? Exception)
      self.callback = nil
    }
  }

  // MARK: - ASAuthorizationControllerDelegate

  func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
    let credential = authorization.credential as? ASAuthorizationAppleIDCredential
    let response: AuthenticationResponse = [
      "fullName": nameComponentsToDict(credential?.fullName),
      "email": credential?.email,
      "user": credential?.user,
      "realUserStatus": realUserStatusToInt(credential?.realUserStatus),
      "state": credential?.state,
      "authorizationCode": dataToString(credential?.authorizationCode),
      "identityToken": dataToString(credential?.identityToken)
    ]

    callback?(response, nil)
    callback = nil

    // Release pending request
    pendingRequests.remove(self)
  }

  func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
    if let error = error as? ASAuthorizationError {
      log.error("Apple authorization failed: \(error.localizedDescription)")
      callback?(nil, exceptionForAuthorizationError(error))
    } else {
      callback?(nil, RequestUnknownException())
    }
    callback = nil

    // Release pending request
    pendingRequests.remove(self)
  }

  // MARK: - ASAuthorizationControllerPresentationContextProviding

  func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
    guard let window = UIApplication.shared.keyWindow else {
      fatalError("Unable to present authentication modal because UIApplication.shared.keyWindow is not available")
    }
    return window
  }
}
