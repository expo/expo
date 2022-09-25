// Copyright 2022-present 650 Industries. All rights reserved.

import SafariServices
import ExpoModulesCore
import AuthenticationServices

final public class WebBrowserModule: Module {
  private var currentWebBrowserSession: WebBrowserSession?
  private var currentAuthSession: WebAuthSession?

  public func definition() -> ModuleDefinition {
    Name("ExpoWebBrowser")

    AsyncFunction("openBrowserAsync") { (url: URL, options: WebBrowserOptions, promise: Promise) throws in
      guard self.currentWebBrowserSession?.isOpen != true else {
        throw WebBrowserAlreadyOpenException()
      }
      self.currentWebBrowserSession = WebBrowserSession(url: url, options: options)
      self.currentWebBrowserSession?.open(promise)
    }
    .runOnQueue(.main)

    AsyncFunction("dismissBrowser") {
      self.currentWebBrowserSession?.dismiss()
      self.currentWebBrowserSession = nil
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
