// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import AuthenticationServices

private let DEV_LAUNCHER_DEFAULT_SCHEME = "expo-dev-launcher"

public class DevLauncherAuth: Module {
  private var redirectPromise: Promise?
  private var authSession: ASWebAuthenticationSession?
  private let presentationContext = DevLauncherAuthPresentationContext()

  public func definition() -> ModuleDefinition {
    Name("ExpoDevLauncherAuth")

    AsyncFunction("openAuthSessionAsync") { (authURL: URL, _: String, promise: Promise) in
      if self.redirectPromise != nil {
        throw WebBrowserAlreadyPresentedException()
      }
      self.redirectPromise = promise

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

      // With ASWebAuthenticationSession, all that is required for the callbackURLScheme is the scheme defined in CFBundleURLSchemes.
      // ://auth is not necessary.
      let scheme = getAuthScheme()

      self.authSession = ASWebAuthenticationSession(url: authURL, callbackURLScheme: scheme, completionHandler: completionHandler)
      self.authSession?.presentationContextProvider = presentationContext
      self.authSession?.prefersEphemeralWebBrowserSession = true
      self.authSession?.start()
    }.runOnQueue(.main)

    AsyncFunction("getAuthSchemeAsync") { () -> String in
      getAuthScheme()
    }

    AsyncFunction("setSessionAsync") { (session: String?) in
      UserDefaults.standard.set(session, forKey: "expo-session-secret")
    }

    AsyncFunction("restoreSessionAsync") {
      return UserDefaults.standard.string(forKey: "expo-session-secret")
    }
  }

  private func getAuthScheme() -> String {
    guard let urlTypes = Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") as? [[String: Any]] else {
      return DEV_LAUNCHER_DEFAULT_SCHEME
    }

    return urlTypes.compactMap { urlType in
      (urlType["CFBundleURLSchemes"] as? [String])?.first
    }.first ?? DEV_LAUNCHER_DEFAULT_SCHEME
  }

  private func flowDidFinish() {
    self.redirectPromise = nil
  }
}

private class DevLauncherAuthPresentationContext: NSObject, ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    let window = UIApplication.shared.windows.first { $0.isKeyWindow }
    return window ?? ASPresentationAnchor()
  }
}
