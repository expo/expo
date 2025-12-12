// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import AuthenticationServices
import Combine

@MainActor
class AuthenticationService: ObservableObject {
  @Published var user: UserActor?
  @Published var selectedAccountId: String?
  @Published var isAuthenticating = false
  @Published var isAuthenticated = false

  private let sessionKey = "expo-session-secret"
  private let selectedAccountKey = "expo-selected-account-id"
  private let presentationContext = ExpoGoAuthPresentationContext()

  var selectedAccount: Account? {
    guard let userData = user,
          let selectedAccountId = selectedAccountId else {
      return nil
    }
    return userData.accounts.first { $0.id == selectedAccountId }
  }

  var isLoggedIn: Bool {
    return isAuthenticated && user != nil
  }

  init() {
    selectedAccountId = UserDefaults.standard.string(forKey: selectedAccountKey)
    checkAuthenticationStatus()
  }

  func checkAuthenticationStatus() {
    let sessionSecret = UserDefaults.standard.string(forKey: sessionKey)
    isAuthenticated = sessionSecret != nil && !sessionSecret!.isEmpty

    if isAuthenticated {
      if let sessionSecret {
        APIClient.shared.setSession(sessionSecret)
      }
      Task {
        await loadUserInfo()
      }
    } else {
      user = nil
      selectedAccountId = nil
    }
  }

  func loadUserInfo() async {
    guard isAuthenticated else { return }

    do {
      let response: MeUserActorResponse = try await APIClient.shared.request(Queries.getCurrentUser())
      user = response.data.meUserActor

      if selectedAccountId == nil, let firstAccount = user?.accounts.first {
        selectAccount(accountId: firstAccount.id)
      }
    } catch {
      print("Failed to load user info: \(error)")
    }
  }

  func signIn() async throws {
    isAuthenticating = true
    defer { isAuthenticating = false }

    let success = try await performAuthentication(isSignUp: false)
    if success {
      await loadUserInfo()
    }
  }

  func signUp() async throws {
    isAuthenticating = true
    defer { isAuthenticating = false }

    let success = try await performAuthentication(isSignUp: true)
    if success {
      await loadUserInfo()
    }
  }

  func signOut() {
    UserDefaults.standard.removeObject(forKey: sessionKey)
    UserDefaults.standard.removeObject(forKey: selectedAccountKey)
    APIClient.shared.setSession(nil)
    user = nil
    selectedAccountId = nil
    isAuthenticated = false
  }

  func selectAccount(accountId: String) {
    selectedAccountId = accountId
    UserDefaults.standard.set(accountId, forKey: selectedAccountKey)
  }

  private func performAuthentication(isSignUp: Bool) async throws -> Bool {
    return try await withCheckedThrowingContinuation { continuation in
      let websiteOrigin = APIClient.shared.websiteOrigin
      let authType = isSignUp ? "signup" : "login"
      let scheme = getURLScheme()
      let redirectBase = "\(scheme)://auth"

      guard let encodedRedirectURI = redirectBase.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
            let url = URL(string: "\(websiteOrigin)/\(authType)?confirm_account=1&app_redirect_uri=\(encodedRedirectURI)") else {
        continuation.resume(throwing: ExpoGoError.invalidURL)
        return
      }

      let session = ASWebAuthenticationSession(
        url: url,
        callbackURLScheme: scheme
      ) { callbackURL, error in
        if let error {
          continuation.resume(throwing: error)
          return
        }

        guard let callbackURL,
          let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false),
          let sessionSecret = components.queryItems?.first(where: { $0.name == "session_secret" })?.value else {
          continuation.resume(throwing: ExpoGoError.noSessionSecret)
          return
        }

        UserDefaults.standard.set(sessionSecret, forKey: self.sessionKey)
        APIClient.shared.setSession(sessionSecret)
        Task { @MainActor in
          self.isAuthenticated = true
        }
        continuation.resume(returning: true)
      }

      session.presentationContextProvider = presentationContext
      session.prefersEphemeralWebBrowserSession = true
      session.start()
    }
  }

  private func getURLScheme() -> String {
    guard let urlTypes = Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") as? [[String: Any]] else {
      return "exp"
    }

    return urlTypes.compactMap { urlType in
      (urlType["CFBundleURLSchemes"] as? [String])?.first
    }.first ?? "exp"
  }
}

private class ExpoGoAuthPresentationContext: NSObject, ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    let window = UIApplication.shared.windows.first { $0.isKeyWindow }
    return window ?? ASPresentationAnchor()
  }
}
