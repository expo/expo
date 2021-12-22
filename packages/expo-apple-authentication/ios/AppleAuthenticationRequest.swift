// Copyright 2018-present 650 Industries. All rights reserved.

import AuthenticationServices

typealias Callback = (_ response: AuthenticationResponse?, _ error: Error?) -> Void

@available(iOS 13.0, *)
internal class AppleAuthenticationRequest :
  NSObject,
  ASAuthorizationControllerDelegate,
  ASAuthorizationControllerPresentationContextProviding
{
  private var callback: Callback?
  
  init(callback: @escaping Callback) {
    self.callback = callback
    super.init()
  }
  
  func request(options: Options) {
    let appleIDProvider = ASAuthorizationAppleIDProvider()
    let request = appleIDProvider.createRequest()
    
    switch (options) {
    case .signIn(let signInOptions):
      request.requestedOperation = .operationLogin
      request.requestedScopes = signInOptions?.requestedScopes
      request.state = signInOptions?.state
      request.nonce = signInOptions?.nonce
      break
      
    case .refresh(let refreshOptions):
      request.requestedOperation = .operationRefresh
      request.user = refreshOptions.user
      request.requestedScopes = refreshOptions.requestedScopes
      request.state = refreshOptions.state
      break
      
    case .signOut(let signOutOptions):
      request.requestedOperation = .operationLogout
      request.user = signOutOptions.user
      request.state = signOutOptions.state
      break
    }
    
    let authController = ASAuthorizationController.init(authorizationRequests: [request])
    authController.presentationContextProvider = self
    authController.delegate = self
    authController.performRequests()
  }
  
  
  // MARK: ASAuthorizationControllerDelegate
  
  func authorizationController(controller: ASAuthorizationController,
                               didCompleteWithAuthorization authorization: ASAuthorization) {
    switch authorization.credential {
    case let appleIDCredential as ASAuthorizationAppleIDCredential:
      let fullName = FullName.init(from: appleIDCredential.fullName)
      let authorizationCode = String.init(data: appleIDCredential.authorizationCode, encoding: NSUTF8StringEncoding)
      let identityToken = String.init(data: appleIDCredential.identityToken, encoding: NSUTF8StringEncoding)
      
      self.callback?(AuthenticationResponse(
        user: appleIDCredential.user,
        state: appleIDCredential.state,
        fullName: fullName,
        email: appleIDCredential.email,
        realUserStatus: appleIDCredential.realUserStatus,
        identityToken: identityToken,
        authorizationCode: authorizationCode), nil)
      self.callback = nil
      return

    default:
      return
    }
  }
  
  func authorizationController(controller: ASAuthorizationController,
                               didCompleteWithError error: Error) {
    self.callback?(nil, error)
    self.callback = nil
  }

  
  // MARK: ASAuthorizationControllerPresentationContextProviding
  
  func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
    return UIApplication.shared.keyWindow!
  }
}

enum Options {
  case signIn(SignInOptions?)
  case refresh(RefreshOptions)
  case signOut(SignOutOptions)
}
