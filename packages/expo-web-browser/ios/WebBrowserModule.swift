// Copyright 2022-present 650 Industries. All rights reserved.

import SafariServices
import ExpoModulesCore
import AuthenticationServices

final public class WebBrowserModule: Module {
  private var currentWebBrowserSession: WebBrowserSession?
  private var currentAuthSession: WebAuthSession?
  private var vcDidPresent = false

  private func isValid(url: URL) -> Bool {
    return url.scheme == "http" || url.scheme == "https"
  }

  public func definition() -> ModuleDefinition {
    Name("ExpoWebBrowser")

    AsyncFunction("openBrowserAsync") { (url: URL, options: WebBrowserOptions, promise: Promise) in
      if vcDidPresent {
        self.currentWebBrowserSession = nil
        vcDidPresent = false
      }

      guard self.currentWebBrowserSession == nil else {
        throw WebBrowserAlreadyOpenException()
      }

      guard self.isValid(url: url) else {
        throw WebBrowserInvalidURLException()
      }

      self.currentWebBrowserSession = WebBrowserSession(url: url, options: options) { [promise] type in
        promise.resolve(["type": type])
        self.currentWebBrowserSession = nil
      } didPresent: {
        self.vcDidPresent = true
      }

      self.currentWebBrowserSession?.open()
    }
    .runOnQueue(.main)

    AsyncFunction("dismissBrowser") { (promise: Promise) in
      currentWebBrowserSession?.dismiss { type in
        self.currentWebBrowserSession = nil
        promise.resolve(["type": type])
      }
    }
    .runOnQueue(.main)

    // MARK: - AuthSession

    AsyncFunction("openAuthSessionAsync") { (authUrl: URL, redirectUrl: URL?, options: AuthSessionOptions, promise: Promise) throws in
      guard self.currentAuthSession?.isOpen != true else {
        throw WebBrowserAlreadyOpenException()
      }
      self.currentAuthSession = WebAuthSession(authUrl: authUrl, redirectUrl: redirectUrl, options: options)
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
