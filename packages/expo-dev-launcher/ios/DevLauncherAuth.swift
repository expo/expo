// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SafariServices
import React

private let DEV_LAUNCHER_DEFAULT_SCHEME = "expo-dev-launcher"

public class DevLauncherAuth: Module {
  private var redirectPromise: Promise?
  private var authSession: SFAuthenticationSession?

  public func definition() -> ModuleDefinition {
    Name("ExpoDevLauncherAuth")

    AsyncFunction("openAuthSessionAsync") { (authURL: String, redirectURL: String, promise: Promise) in
      try self.initializeWebBrowser(promise)

      if #available(iOS 11.0, *) {
        guard let url = URL(string: authURL) else {
          promise.reject("invalid_auth_url", "Invalid auth URL")
          return
        }

        let completionHandler: (URL?, Error?) -> Void = { [weak self]  callbackURL, error in
          // check if flow didn't already finish
          guard let strongSelf = self, let redirectPromise = strongSelf.redirectPromise else {
            return
          }

          if let callbackURL = callbackURL, error == nil {
            let url = callbackURL.absoluteString
            redirectPromise.resolver(["type": "success", "url": url])
          } else {
            redirectPromise.resolver(["type": "cancel"])
          }
          strongSelf.flowDidFinish()
        }

        self.authSession = SFAuthenticationSession(url: url, callbackURLScheme: redirectURL, completionHandler: completionHandler)
        self.authSession?.start()
      } else {
        promise.resolve([
          "type": "cancel",
          "message": "openAuthSessionAsync requires iOS 11 or greater"
        ])
        self.flowDidFinish()
      }
    }

    AsyncFunction("getAuthSchemeAsync") { () -> String in
      if let urlTypes = Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") as? [[String: Any]] {
        for urlType in urlTypes {
          if let schemes = urlType["CFBundleURLSchemes"] as? [String], !schemes.isEmpty {
            return schemes[0]
          }
        }
      }

      return DEV_LAUNCHER_DEFAULT_SCHEME
    }

    AsyncFunction("setSessionAsync") { (session: String?) in
      UserDefaults.standard.set(session, forKey: "expo-session-secret")
    }

    AsyncFunction("restoreSessionAsync") {
      return UserDefaults.standard.string(forKey: "expo-session-secret")
    }
  }

  /**
   * Helper that is used in openBrowserAsync and openAuthSessionAsync
   */
  private func initializeWebBrowser(_ promise: Promise) throws {
    if self.redirectPromise != nil {
      throw WebBrowserException()
    }
    self.redirectPromise = promise
  }

  private func flowDidFinish() {
    self.redirectPromise = nil
  }
}
