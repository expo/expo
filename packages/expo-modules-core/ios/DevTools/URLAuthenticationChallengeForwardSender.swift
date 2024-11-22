// Copyright 2015-present 650 Industries. All rights reserved.

/**
 A helper class to forward URLAuthenticationChallenge completion handler to URLAuthenticationChallengeSender
 */
internal final class URLAuthenticationChallengeForwardSender: NSObject, URLAuthenticationChallengeSender {
  let completionHandler: (URLSession.AuthChallengeDisposition, URLCredential?) -> Void

  init(completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
    self.completionHandler = completionHandler
    super.init()
  }

  func use(_ credential: URLCredential, for challenge: URLAuthenticationChallenge) {
    completionHandler(.useCredential, credential)
  }

  func continueWithoutCredential(for challenge: URLAuthenticationChallenge) {
    completionHandler(.useCredential, nil)
  }

  func cancel(_ challenge: URLAuthenticationChallenge) {
    completionHandler(.cancelAuthenticationChallenge, nil)
  }

  func performDefaultHandling(for challenge: URLAuthenticationChallenge) {
    completionHandler(.performDefaultHandling, nil)
  }

  func rejectProtectionSpaceAndContinue(with challenge: URLAuthenticationChallenge) {
    completionHandler(.rejectProtectionSpace, nil)
  }
}
