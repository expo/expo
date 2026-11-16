// Copyright 2022-present 650 Industries. All rights reserved.

import SafariServices
import ExpoModulesCore
import AuthenticationServices

@ExpoModule("ExpoWebBrowser")
final public class WebBrowserModule: Module {
  @MainActor
  private var currentWebBrowserSession: WebBrowserSession?
  @MainActor
  private var currentAuthSession: WebAuthSession?
  @MainActor
  private var vcDidPresent = false

  private func isValid(url: URL) -> Bool {
    return url.scheme == "http" || url.scheme == "https"
  }

  @JS
  @MainActor
  func openBrowserAsync(url: URL, options: WebBrowserOptions) async throws -> [String: String] {
    if vcDidPresent {
      currentWebBrowserSession = nil
      vcDidPresent = false
    } else if let session = currentWebBrowserSession, !session.isPresented {
      // The presentation was dropped, so no delegate callback will ever release this session.
      session.onDismiss("cancel")
    }

    guard currentWebBrowserSession == nil else {
      return ["type": "locked"]
    }

    guard isValid(url: url) else {
      throw WebBrowserInvalidURLException()
    }

    return await withCheckedContinuation { continuation in
      // The session can report more than one dismissal, but only the first one settles the call.
      var continuation: CheckedContinuation<[String: String], Never>? = continuation

      currentWebBrowserSession = WebBrowserSession(url: url, options: options) { type in
        continuation?.resume(returning: ["type": type])
        continuation = nil
        self.currentWebBrowserSession = nil
      } didPresent: {
        self.vcDidPresent = true
      }

      currentWebBrowserSession?.open()
    }
  }

  @JS
  @MainActor
  func dismissBrowser() async throws -> [String: String] {
    guard let session = currentWebBrowserSession else {
      throw WebBrowserNotOpenException()
    }

    return await withCheckedContinuation { continuation in
      session.dismiss { type in
        self.currentWebBrowserSession = nil
        continuation.resume(returning: ["type": type])
      }
    }
  }

  // MARK: - AuthSession

  @JS
  @MainActor
  func openAuthSessionAsync(
    authUrl: URL,
    redirectUrl: URL?,
    options: AuthSessionOptions
  ) async throws -> [String: String?] {
    guard currentAuthSession?.isOpen != true else {
      throw WebBrowserAlreadyOpenException()
    }
    let session = WebAuthSession(authUrl: authUrl, redirectUrl: redirectUrl, options: options)
    currentAuthSession = session
    return try await session.open()
  }

  @JS
  @MainActor
  func dismissAuthSession() async {
    currentAuthSession?.dismiss()
    currentAuthSession = nil
  }

  // MARK: - Stubs for jest-expo-mock-generator

  @JS
  func warmUpAsync() async {}

  @JS
  func coolDownAsync() async {}

  @JS
  func mayInitWithUrlAsync() async {}

  @JS
  func getCustomTabsSupportingBrowsersAsync() async {}
}
