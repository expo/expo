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
  private let presentationContext = AuthPresentationContextProvider()

  var sessionSecret: String? {
    UserDefaults.standard.string(forKey: sessionKey)
  }

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
    isAuthenticated = !(sessionSecret?.isEmpty ?? true)

    if isAuthenticated {
      Task {
        if let sessionSecret {
          await APIClient.shared.setSession(sessionSecret)
        }
        await loadUserInfo()
      }
    } else {
      user = nil
      selectedAccountId = nil
    }
  }

  func loadUserInfo() async {
    guard isAuthenticated else { return }
    await fetchUserInfo()
  }

  private func fetchUserInfo() async {
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

  func signUp() async throws {
    isAuthenticating = true
    defer { isAuthenticating = false }

    if let sessionSecret = try await performAuthentication(path: "signup") {
      await completeLogin(with: sessionSecret)
    }
  }

  func ssoLogin() async throws {
    isAuthenticating = true
    defer { isAuthenticating = false }

    if let sessionSecret = try await performAuthentication(path: "sso-login") {
      await completeLogin(with: sessionSecret)
    }
  }

  func completeLogin(with sessionSecret: String) async {
    UserDefaults.standard.set(sessionSecret, forKey: sessionKey)
    await APIClient.shared.setSession(sessionSecret)
    // Fetch user info before setting isAuthenticated so account data is ready
    // when the UI switches to the account selector
    await fetchUserInfo()
    isAuthenticated = true
  }

  func signOut() {
    UserDefaults.standard.removeObject(forKey: sessionKey)
    UserDefaults.standard.removeObject(forKey: selectedAccountKey)
    Task {
      await APIClient.shared.setSession(nil)
    }
    user = nil
    selectedAccountId = nil
    isAuthenticated = false
  }

  func selectAccount(accountId: String) {
    selectedAccountId = accountId
    UserDefaults.standard.set(accountId, forKey: selectedAccountKey)
  }

  private func performAuthentication(path: String) async throws -> String? {
    let scheme = try getURLScheme()
    let websiteOrigin = APIClient.shared.websiteOrigin

    return try await withCheckedThrowingContinuation { continuation in
      let redirectBase = "\(scheme)://auth"

      guard let encodedRedirectURI = redirectBase.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
            let url = URL(string: "\(websiteOrigin)/\(path)?confirm_account=1&app_redirect_uri=\(encodedRedirectURI)") else {
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

        continuation.resume(returning: sessionSecret)
      }

      session.presentationContextProvider = presentationContext
      session.prefersEphemeralWebBrowserSession = false
      session.start()
    }
  }

  private func getURLScheme() throws -> String {
    guard let urlTypes = Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") as? [[String: Any]] else {
      throw ExpoGoError.missingURLScheme
    }

    guard let scheme = urlTypes.compactMap({ urlType in
      (urlType["CFBundleURLSchemes"] as? [String])?.first
    }).first else {
      throw ExpoGoError.missingURLScheme
    }

    return scheme
  }
}

private class AuthPresentationContextProvider: NSObject, ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    let window = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap { $0.windows }
      .first { $0.isKeyWindow }
    return window ?? ASPresentationAnchor()
  }
}
