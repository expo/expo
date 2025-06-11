// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore
import AuthenticationServices

private class PresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    #if os(iOS)
    return UIApplication.shared.keyWindow ?? ASPresentationAnchor()
    #else
    return NSApp.mainWindow ?? ASPresentationAnchor()
    #endif
  }
}

final internal class WebAuthSession {
  var authSession: ASWebAuthenticationSession?
  var promise: Promise?
  var isOpen: Bool {
    promise != nil
  }

  // It must be initialized before hand as `ASWebAuthenticationSession` holds it as a weak property
  private var presentationContextProvider = PresentationContextProvider()

  init(authUrl: URL, redirectUrl: URL?, options: AuthSessionOptions) {
    self.authSession = ASWebAuthenticationSession(
      url: authUrl,
      callbackURLScheme: redirectUrl?.scheme,
      completionHandler: { callbackUrl, error in
        self.finish(with: [
          "type": callbackUrl != nil ? "success" : "cancel",
          "url": callbackUrl?.absoluteString,
          "error": error?.localizedDescription
        ])
      }
    )
    self.authSession?.prefersEphemeralWebBrowserSession = options.preferEphemeralSession
  }

  func open(_ promise: Promise) {
    authSession?.presentationContextProvider = presentationContextProvider
    authSession?.start()
    self.promise = promise
  }

  func dismiss() {
    authSession?.cancel()
    finish(with: ["type": "dismiss"])
  }

  // MARK: - Private

  private func finish(with result: [String: String?]) {
    promise?.resolve(result)
    promise = nil
    authSession = nil
  }
}
