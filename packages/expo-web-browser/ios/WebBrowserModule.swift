// Copyright 2022-present 650 Industries. All rights reserved.

import AuthenticationServices
import ExpoModulesCore
import SafariServices

final public class WebBrowserModule: Module {
  private var currentWebBrowserSession: WebBrowserSession?
  private var currentAuthSession: WebAuthSession?

  private func isValidUrl(urlString: String?) -> Bool {
    guard let urlString = urlString,
      let url = URL(string: urlString)
    else {
      return false
    }

    return url.scheme == "http" || url.scheme == "https"
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoWebBrowser")

    AsyncFunction("openBrowserAsync") { (url: URL, options: WebBrowserOptions, promise: Promise) in
      guard self.currentWebBrowserSession == nil else {
        throw WebBrowserAlreadyOpenException()
      }

      guard self.isValidUrl(urlString: url.absoluteString) else {
        throw WebBrowserInvalidURLException()
      }

      self.currentWebBrowserSession = WebBrowserSession(url: url, options: options) {
        [promise] type in
        promise.resolve(["type": type])
        self.currentWebBrowserSession = nil
      }

      self.currentWebBrowserSession?.open()
    }
    .runOnQueue(.main)

    AsyncFunction("dismissBrowser") {
      currentWebBrowserSession?.dismiss()
      currentWebBrowserSession = nil
    }
    .runOnQueue(.main)

    // MARK: - AuthSession

    AsyncFunction("openAuthSessionAsync") {
      (authUrl: URL, redirectUrl: URL?, options: AuthSessionOptions, promise: Promise) throws in
      guard self.currentAuthSession?.isOpen != true else {
        throw WebBrowserAlreadyOpenException()
      }
      self.currentAuthSession = WebAuthSession(
        authUrl: authUrl, redirectUrl: redirectUrl, options: options)
      self.currentAuthSession?.open(promise)
    }
    .runOnQueue(.main)

    AsyncFunction("dismissAuthSession") {
      self.currentAuthSession?.dismiss()
      self.currentAuthSession = nil
    }
    .runOnQueue(.main)

    // MARK: - Stubs for jest-expo-mock-generator

    AsyncFunction("warmUpAsync") {}
    AsyncFunction("coolDownAsync") {}
    AsyncFunction("mayInitWithUrlAsync") {}
    AsyncFunction("getCustomTabsSupportingBrowsers") {}
  }
}
