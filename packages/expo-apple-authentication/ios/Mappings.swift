// Copyright 2021-present 650 Industries. All rights reserved.

import AuthenticationServices

@available(iOS 13.0, *)
internal func mapCredentialState(_ state: ASAuthorizationAppleIDProvider.CredentialState) -> Int {
  switch (state) {
  case .revoked: return 0
  case .authorized: return 1
  case .notFound: return 2
  case .transferred: return 3
  @unknown default:
    fatalError()
  }
}
