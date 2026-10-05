// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import AuthenticationServices
import Combine
import ExpoModulesCore

extension Notification.Name {
  static let expoSessionDidChange = Notification.Name("expo-session-did-change")
}

enum LoginOutcome: Equatable {
  case signedIn
  case alreadySignedIn(username: String)
  case failed
}

@MainActor
class AuthenticationService: ObservableObject {
  @Published var user: UserActor?
  @Published var selectedAccountId: String?
  @Published var isAuthenticating = false
  @Published var isAuthenticated = false
  @Published private(set) var sessions: [StoredSession] = []
  @Published private(set) var activeSessionId: String?

  nonisolated static let deviceLoginGrantsKey = "expo-device-login-grants"
  private let store: SessionStore
  private let presentationContext = AuthPresentationContextProvider()
  private var cancellables = Set<AnyCancellable>()

  var sessionSecret: String? {
    store.activeLiveSession?.sessionSecret
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

  init(store: SessionStore = .shared) {
    self.store = store
    checkAuthenticationStatus()
    observeSessionChanges()
  }

  func checkAuthenticationStatus() {
    store.fallBackFromExpiredActiveSession()
    publishStoreState()
    if isAuthenticated {
      Task {
        await loadUserInfo()
      }
    }
  }

  func reloadActiveSession() async {
    publishStoreState()
    await loadUserInfo()
  }

  private func publishStoreState() {
    let active = store.activeSession
    if active?.id != activeSessionId {
      user = nil
    }
    sessions = store.sessions
    activeSessionId = active?.id
    let live = store.activeLiveSession
    isAuthenticated = live != nil
    selectedAccountId = live?.selectedAccountId
    if live == nil {
      user = nil
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
        await signOut()
      }
    } catch {
      print("[AuthenticationService] Failed to load user info: \(error)")
    }
  }

  /// Returns false only when the actor is definitively null, not when the request merely failed.
  private func fetchUserInfo() async throws -> Bool {
    guard let sessionId = store.activeLiveSession?.id else {
      return true
    }
    let response: MeActorResponse = try await APIClient.shared.request(Queries.getCurrentUser())
    guard store.activeSession?.id == sessionId else {
      return true
    }
    guard let actor = response.data.meActor else {
      guard response.isRevokedSession else {
        throw APIError.invalidResponse
      }
      print("[AuthenticationService] meActor was null. Signed in as an actor type Expo Go does not model.")
      return false
    }
    store.updateProfile(id: sessionId, from: actor)
    publishStoreState()
    user = actor
    return true
  }

  @discardableResult
  func signUp() async throws -> LoginOutcome? {
    try await authenticate(path: "signup")
  }

  @discardableResult
  func signIn() async throws -> LoginOutcome? {
    try await authenticate(path: "login")
  }

  @discardableResult
  func ssoLogin() async throws -> LoginOutcome? {
    try await authenticate(path: "sso-login")
  }

  private func authenticate(path: String) async throws -> LoginOutcome? {
    isAuthenticating = true
    defer { isAuthenticating = false }

    guard let sessionSecret = try await performAuthentication(path: path) else {
      return nil
    }
    return await completeLogin(with: sessionSecret)
  }

  @discardableResult
  func completeLogin(with sessionSecret: String, expiresAt: Date? = nil) async -> LoginOutcome {
    let knownUserIds = Set(store.sessions.compactMap(\.userId))
    let previousSessionId = store.activeSession?.id
    let session = store.add(sessionSecret: sessionSecret, expiresAt: expiresAt)
    do {
      // Fetch user info before publishing so account data is ready
      // when the UI switches to the account list
      guard try await fetchUserInfo() else {
        store.remove(id: session.id)
        if let previousSessionId {
          store.activate(id: previousSessionId)
        }
        await reloadActiveSession()
        return .failed
      }
    } catch {
      print("[AuthenticationService] Failed to load user info: \(error)")
      publishStoreState()
      return .signedIn
    }
    if let current = store.activeSession, let userId = current.userId, knownUserIds.contains(userId) {
      return .alreadySignedIn(username: current.username ?? userId)
    }
    return .signedIn
  }

  func signOut() async {
    if let id = store.activeSession?.id {
      removeSessionAndGrants(id: id)
    }
    await reloadActiveSession()
  }

  func switchSession(id: String) async {
    store.activate(id: id)
    await reloadActiveSession()
  }

  func removeSession(id: String) {
    removeSessionAndGrants(id: id)
    publishStoreState()
  }

  func selectAccount(accountId: String) {
    guard let id = store.activeSession?.id else { return }
    selectAccount(accountId, inSession: id)
    selectedAccountId = accountId
  }

  func selectAccount(_ accountId: String, inSession id: String) {
    store.selectAccount(accountId, forSession: id)
    sessions = store.sessions
  }

  private func removeSessionAndGrants(id: String) {
    if let username = store.sessions.first(where: { $0.id == id })?.username {
      Self.removeDeviceLoginGrants(forUsername: username)
    }
    store.remove(id: id)
  }

  /// The stored expiry is the only local signal that the session died, avoiding a round trip on every project open.
  nonisolated static func isSessionExpired() -> Bool {
    SessionStore.shared.activeSession?.isExpired ?? false
  }

  /// The signed-in username, or nil if there is no live, unexpired session.
  nonisolated static var currentUsername: String? {
    SessionStore.shared.activeLiveSession?.username
  }

  nonisolated static func deactivateExpiredSession() {
    SessionStore.shared.deactivateExpiredActiveSession()
    NotificationCenter.default.post(name: .expoSessionDidChange, object: nil)
  }

  /// A stored secret can belong to the browser's expo.dev session, and signing in as another user there ends it.
  nonisolated static func usesEphemeralBrowserSession(storedSessions: [StoredSession]) -> Bool {
    !storedSessions.isEmpty
  }

  nonisolated static func removeDeviceLoginGrants(forUsername username: String) {
    let grants = UserDefaults.standard.dictionary(forKey: deviceLoginGrantsKey) as? [String: String] ?? [:]
    UserDefaults.standard.set(grants.filter { $0.value != username }, forKey: deviceLoginGrantsKey)
  }

  /// Remembers which account a device login granted for a verification host, so rescanning a project behind that
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

  private func performAuthentication(path: String) async throws -> String? {
    let scheme = try getURLScheme()
    let ephemeral = Self.usesEphemeralBrowserSession(storedSessions: store.sessions)
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
      session.prefersEphemeralWebBrowserSession = ephemeral
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
    return SceneGeometry.keyWindow() ?? ASPresentationAnchor()
  }
}
