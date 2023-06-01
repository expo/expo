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

    AsyncFunction("openAuthSessionAsync") { (authURL: URL, redirectURL: String, promise: Promise) in
      if self.redirectPromise != nil {
        throw WebBrowserAlreadyPresentedException()
      }
      self.redirectPromise = promise

      if #available(iOS 11.0, *) {
        let completionHandler: (URL?, Error?) -> Void = { [weak self] callbackURL, error in
          // check if flow didn't already finish
          guard let redirectPromise = self?.redirectPromise else {
            return
          }

          if let callbackURL, error == nil {
            let url = callbackURL.absoluteString
            redirectPromise.resolve(["type": "success", "url": url])
          } else {
            redirectPromise.resolve(["type": "cancel"])
          }
          self?.flowDidFinish()
        }

        self.authSession = SFAuthenticationSession(url: authURL, callbackURLScheme: redirectURL, completionHandler: completionHandler)
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

  private func flowDidFinish() {
    self.redirectPromise = nil
  }
}
