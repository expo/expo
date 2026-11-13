// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore
import AuthenticationServices

private class PresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    #if os(iOS)
    return SceneGeometry.keyWindow() ?? ASPresentationAnchor()
    #else
    return NSApp.mainWindow ?? ASPresentationAnchor()
    #endif
  }
}

final internal class WebAuthSession {
  var authSession: ASWebAuthenticationSession?
  var continuation: CheckedContinuation<[String: String?], Error>?
  var isOpen: Bool {
    continuation != nil
  }

  // It must be initialized before hand as `ASWebAuthenticationSession` holds it as a weak property
  private var presentationContextProvider = PresentationContextProvider()

  init(authUrl: URL, redirectUrl: URL?, options: AuthSessionOptions) {
    let completionHandler: ASWebAuthenticationSession.CompletionHandler = { callbackUrl, error in
      self.finish(with: WebAuthSession.result(callbackUrl: callbackUrl, error: error))
    }

    // iOS 17.4+/macOS 14.4+ supports HTTPS callbacks with host/path matching.
    // Only used when preferUniversalLinks is true, as it requires the app to have
    // the Associated Domains entitlement for the redirect host.
    if options.preferUniversalLinks,
       #available(iOS 17.4, macOS 14.4, *),
       let redirectUrl,
       redirectUrl.scheme == "https",
       let host = redirectUrl.host(percentEncoded: false),
       !host.isEmpty {
      // Use the new callback API for HTTPS universal links
      // Pass an empty string for the path to match any path under the host if no specific path is provided
      self.authSession = ASWebAuthenticationSession(
        url: authUrl,
        callback: .https(host: host, path: redirectUrl.path),
        completionHandler: completionHandler
      )
    } else {
      // Fallback to the old API for custom schemes or older iOS versions
      self.authSession = ASWebAuthenticationSession(
        url: authUrl,
        callbackURLScheme: redirectUrl?.scheme,
        completionHandler: completionHandler
      )
    }
    self.authSession?.prefersEphemeralWebBrowserSession = options.preferEphemeralSession
  }

  @MainActor
  func open() async throws -> [String: String?] {
    authSession?.presentationContextProvider = presentationContextProvider
    return try await withCheckedThrowingContinuation { continuation in
      self.continuation = continuation
      afterDismissalInFlight {
        // `dismiss()` settles a session that still waits here.
        guard let continuation = self.continuation else {
          return
        }
        if self.authSession?.start() != true {
          self.continuation = nil
          continuation.resume(throwing: WebAuthSessionFailedToStartException())
        }
      }
    }
  }

  func dismiss() {
    authSession?.cancel()
    finish(with: ["type": "dismiss"])
  }

  static func result(callbackUrl: URL?, error: Error?) -> [String: String?] {
    return [
      "type": callbackUrl != nil ? "success" : "cancel",
      "url": callbackUrl?.absoluteString,
      "error": error?.localizedDescription
    ]
  }

  // MARK: - Private

  // UIKit drops a presentation that starts while the top view controller is being dismissed.
  // `start()` still returns `true` then, and the completion handler never runs.
  @MainActor
  private func afterDismissalInFlight(_ start: @escaping @MainActor () -> Void) {
    #if os(iOS)
    var topViewController = SceneGeometry.keyWindow()?.rootViewController
    while let presentedViewController = topViewController?.presentedViewController {
      topViewController = presentedViewController
    }
    if let topViewController,
       topViewController.isBeingDismissed,
       let transitionCoordinator = topViewController.transitionCoordinator,
       transitionCoordinator.animate(alongsideTransition: nil, completion: { _ in start() }) {
      return
    }
    #endif
    start()
  }

  private func finish(with result: [String: String?]) {
    continuation?.resume(returning: result)
    continuation = nil
    authSession = nil
  }
}
