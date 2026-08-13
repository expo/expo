// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import AuthenticationServices
import Combine

extension Notification.Name {
  static let expoSessionDidChange = Notification.Name("expo-session-did-change")
}

@MainActor
class AuthenticationService: ObservableObject {
  @Published var user: UserActor?
  @Published var selectedAccountId: String?
  @Published var isAuthenticating = false
  @Published var isAuthenticated = false

  nonisolated static let sessionKey = "expo-session-secret"
  nonisolated static let usernameKey = "expo-username"
  nonisolated static let selectedAccountKey = "expo-selected-account-id"
  nonisolated static let sessionExpiresAtKey = "expo-session-expires-at"
  nonisolated static let deviceLoginGrantsKey = "expo-device-login-grants"
  private let presentationContext = AuthPresentationContextProvider()
  private var cancellables = Set<AnyCancellable>()

  var sessionSecret: String? {
    UserDefaults.standard.string(forKey: Self.sessionKey)
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
    selectedAccountId = UserDefaults.standard.string(forKey: Self.selectedAccountKey)
    checkAuthenticationStatus()
    observeSessionChanges()
  }

  func checkAuthenticationStatus() {
    if Self.isPartnerSessionExpired() {
      // The bridge reads this expiry to explain the failure, then clears it.
      Self.deleteNativeSession()
      user = nil
      selectedAccountId = nil
      isAuthenticated = false
      return
    }

    let sessionSecret = UserDefaults.standard.string(forKey: Self.sessionKey)
    isAuthenticated = !(sessionSecret?.isEmpty ?? true)

    if isAuthenticated {
      if let sessionSecret {
        Self.saveNativeSession(sessionSecret)
      }
      Task {
        if let sessionSecret {
          await APIClient.shared.setSession(sessionSecret)
        }
        await loadUserInfo()
      }
    } else {
      Self.deleteNativeSession()
      user = nil
      selectedAccountId = nil
    }
  }

  private func observeSessionChanges() {
    NotificationCenter.default.publisher(for: .expoSessionDidChange)
      .sink { [weak self] _ in
        Task { @MainActor in
          self?.checkAuthenticationStatus()
        }
      }
      .store(in: &cancellables)
  }

  func loadUserInfo() async {
    guard isAuthenticated else { return }
    do {
      if try await fetchUserInfo() == false {
        signOut()
      }
    } catch {
      print("[AuthenticationService] Failed to load user info: \(error)")
    }
  }

  /// Returns false only when the actor is definitively null, not when the request merely failed.
  private func fetchUserInfo() async throws -> Bool {
    let response: MeActorResponse = try await APIClient.shared.request(Queries.getCurrentUser())
    guard let actor = response.data.meActor else {
      print("[AuthenticationService] meActor was null. Signed in as an actor type Expo Go does not model.")
      return false
    }
    user = actor
    UserDefaults.standard.set(actor.username, forKey: Self.usernameKey)

    if selectedAccountId == nil, let firstAccount = actor.accounts.first {
      selectAccount(accountId: firstAccount.id)
    }
    return true
  }

  func signUp() async throws {
    isAuthenticating = true
    defer { isAuthenticating = false }

    if let sessionSecret = try await performAuthentication(path: "signup") {
      await completeLogin(with: sessionSecret)
    }
  }

  func signIn() async throws {
    isAuthenticating = true
    defer { isAuthenticating = false }

    if let sessionSecret = try await performAuthentication(path: "login") {
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

  func completeLogin(with sessionSecret: String, expiresAt: Date? = nil) async {
    UserDefaults.standard.set(sessionSecret, forKey: Self.sessionKey)
    if let expiresAt {
      UserDefaults.standard.set(expiresAt.timeIntervalSince1970, forKey: Self.sessionExpiresAtKey)
    } else {
      UserDefaults.standard.removeObject(forKey: Self.sessionExpiresAtKey)
    }
    Self.saveNativeSession(sessionSecret)
    await APIClient.shared.setSession(sessionSecret)
    do {
      // Fetch user info before setting isAuthenticated so account data is ready
      // when the UI switches to the account selector
      guard try await fetchUserInfo() else {
        signOut()
        return
      }
      isAuthenticated = true
    } catch {
      print("[AuthenticationService] Failed to load user info: \(error)")
      isAuthenticated = true
    }
  }

  func signOut() {
    Self.clearSession()
    user = nil
    selectedAccountId = nil
    isAuthenticated = false
  }

  nonisolated private static func saveNativeSession(_ sessionSecret: String) {
    do {
      try Session.sharedInstance.saveSession(
        toKeychain: ["sessionSecret": sessionSecret] as NSDictionary
      )
    } catch {
      print("[AuthenticationService] Failed to save native session: \(error.localizedDescription)")
    }
  }

  nonisolated private static func deleteNativeSession() {
    do {
      try Session.sharedInstance.deleteSessionFromKeychain()
    } catch {
      print("[AuthenticationService] Failed to clear native session: \(error.localizedDescription)")
    }
  }

  /// The stored expiry is the only local signal that a partner session died, avoiding a round trip on every project open.
  nonisolated static func isPartnerSessionExpired() -> Bool {
    guard let expiresAt = UserDefaults.standard.object(forKey: sessionExpiresAtKey) as? Double else {
      return false
    }
    return Date().timeIntervalSince1970 >= expiresAt
  }

  /// The signed-in username, or nil if there is no live, unexpired session.
  nonisolated static var currentUsername: String? {
    guard UserDefaults.standard.string(forKey: sessionKey) != nil,
          !isPartnerSessionExpired() else {
      return nil
    }
    return UserDefaults.standard.string(forKey: usernameKey)
  }

  /// Remembers which account a device login granted for a partner host, so rescanning a project behind that
  /// host does not ask again when the user is already signed in as that account.
  nonisolated static func recordDeviceLoginGrant(username: String, forVerificationHost host: String) {
    var grants = UserDefaults.standard.dictionary(forKey: deviceLoginGrantsKey) as? [String: String] ?? [:]
    grants[host] = username
    UserDefaults.standard.set(grants, forKey: deviceLoginGrantsKey)
  }

  nonisolated static func isDeviceLoginAlreadyGranted(forVerificationHost host: String) -> Bool {
    guard let username = currentUsername else {
      return false
    }
    let grants = UserDefaults.standard.dictionary(forKey: deviceLoginGrantsKey) as? [String: String] ?? [:]
    return grants[host] == username
  }

  nonisolated static func clearSession() {
    let defaults = UserDefaults.standard
    defaults.removeObject(forKey: sessionKey)
    defaults.removeObject(forKey: usernameKey)
    defaults.removeObject(forKey: selectedAccountKey)
    defaults.removeObject(forKey: sessionExpiresAtKey)
    deleteNativeSession()
    Task { await APIClient.shared.setSession(nil) }
    NotificationCenter.default.post(name: .expoSessionDidChange, object: nil)
  }

  func selectAccount(accountId: String) {
    selectedAccountId = accountId
    UserDefaults.standard.set(accountId, forKey: Self.selectedAccountKey)
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
