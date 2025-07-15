// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation
import AuthenticationServices

private let selectedAccountKey = "expo-selected-account-id"
private let sessionKey = "expo-session-secret"

private let DEV_LAUNCHER_DEFAULT_SCHEME = "expo-dev-launcher"

@MainActor
class DevLauncherViewModel: ObservableObject {
  @Published var recentlyOpenedApps: [RecentlyOpenedApp] = []
  @Published var buildInfo: [AnyHashable: Any] = [:]
  @Published var updatesConfig: [AnyHashable: Any] = [:]
  @Published var devServers: [DevServer] = []
  @Published var currentError: EXDevLauncherAppError?
  @Published var showingError = false
  @Published var shakeDevice = true {
    didSet {
      saveMenuPreference(key: "EXDevMenuMotionGestureEnabled", value: shakeDevice)
    }
  }
  @Published var threeFingerLongPress = false {
    didSet {
      saveMenuPreference(key: "EXDevMenuTouchGestureEnabled", value: threeFingerLongPress)
    }
  }
  @Published var showOnLaunch = false {
    didSet {
      saveMenuPreference(key: "EXDevMenuShowsAtLaunch", value: showOnLaunch)
    }
  }
  @Published var isAuthenticated = false
  @Published var isAuthenticating = false
  @Published var user: User?
  @Published var selectedAccountId: String?

  private let presentationContext = DevLauncherAuthPresentationContext()

  var selectedAccount: UserAccount? {
    guard let userData = user,
      let selectedAccountId = selectedAccountId else {
      return nil
    }
    return userData.accounts.first { $0.id == selectedAccountId }
  }

  var structuredBuildInfo: BuildInfo {
    return BuildInfo(buildInfo: buildInfo, updatesConfig: updatesConfig)
  }

  var isLoggedIn: Bool {
    return isAuthenticated && user != nil
  }

  init() {
    loadData()
    discoverDevServers()
    checkAuthenticationStatus()
  }

  private func loadData() {
    let controller = EXDevLauncherController.sharedInstance()
    self.buildInfo = controller.getBuildInfo()
    self.updatesConfig = controller.getUpdatesConfig(nil)

    loadRecentlyOpenedApps()
    loadMenuPreferences()
  }

  private func loadRecentlyOpenedApps() {
    let apps = EXDevLauncherController.sharedInstance().recentlyOpenedAppsRegistry.recentlyOpenedApps()

    self.recentlyOpenedApps = apps.compactMap { app in
      guard let name = app["name"] as? String,
      let url = app["url"] as? String,
      let timestampInt64 = app["timestamp"] as? Int64,
      let isEasUpdate = app["isEasUpdate"] as? Bool? else {
        return nil
      }

      let timestamp = Date(timeIntervalSince1970: TimeInterval(timestampInt64))
      return RecentlyOpenedApp(name: name, url: url, timestamp: timestamp, isEasUpdate: isEasUpdate)
    }
  }

  func openApp(url: String) {
    guard let bundleUrl = URL(string: url) else {
      return
    }

    EXDevLauncherController.sharedInstance().loadApp(
      bundleUrl,
      onSuccess: nil,
      onError: { [weak self] error in
        let appError = EXDevLauncherAppError(
          message: "Failed to load app from \(url) with error: \(error.localizedDescription)",
          stack: nil
        )
        DispatchQueue.main.async {
          self?.showError(appError)
        }
      })
  }

  func clearRecentlyOpenedApps() {
    EXDevLauncherController.sharedInstance().clearRecentlyOpenedApps()
    self.recentlyOpenedApps = []
  }

  func isCompatibleRuntime(_ runtimeVersion: String) -> Bool {
    return runtimeVersion == structuredBuildInfo.runtimeVersion
  }

  func discoverDevServers() {
    Task {
      var discoveredServers: [DevServer] = []

      // swiftlint:disable number_separator
      let portsToCheck = [8081, 8082, 8_083, 8084, 8085, 19000, 19001, 19002]
      // swiftlint:enable number_separator
      let baseAddress = "http://localhost"

      await withTaskGroup(of: DevServer?.self) { group in
        for port in portsToCheck {
          group.addTask {
            await self.checkDevServer(url: "\(baseAddress):\(port)")
          }
        }

        for await server in group {
          if let server = server {
            discoveredServers.append(server)
          }
        }
      }

      await MainActor.run {
        self.devServers = discoveredServers.sorted { $0.url < $1.url }
      }
    }
  }

  private func checkDevServer(url: String) async -> DevServer? {
    guard let statusURL = URL(string: "\(url)/status") else {
      return nil
    }

    do {
      let (data, response) = try await URLSession.shared.data(from: statusURL)

      if let httpResponse = response as? HTTPURLResponse,
        httpResponse.statusCode == 200 {
        if let statusString = String(data: data, encoding: .utf8),
          statusString.contains("packager-status:running") {
          return DevServer(
            url: url,
            description: url,
            source: "local"
          )
        }
      }
    } catch {
      // Server not running or not reachable
    }

    return nil
  }

  func showError(_ error: EXDevLauncherAppError) {
    currentError = error
    showingError = true
  }

  func dismissError() {
    currentError = nil
    showingError = false
  }

  func reloadCurrentApp() {
    guard let appUrl = EXDevLauncherController.sharedInstance().appManifestURLWithFallback() else {
      dismissError()
      return
    }

    EXDevLauncherController.sharedInstance().loadApp(
      appUrl,
      onSuccess: { [weak self] in
        self?.dismissError()
      },
      onError: { [weak self] _ in
        self?.dismissError()
      })
  }

  private func loadMenuPreferences() {
    let defaults = UserDefaults.standard

    shakeDevice = defaults.object(forKey: "EXDevMenuMotionGestureEnabled") as? Bool ?? true
    threeFingerLongPress = defaults.object(forKey: "EXDevMenuTouchGestureEnabled") as? Bool ?? true
    showOnLaunch = defaults.object(forKey: "EXDevMenuShowsAtLaunch") as? Bool ?? false
  }

  private func saveMenuPreference(key: String, value: Bool) {
    UserDefaults.standard.set(value, forKey: key)
    UserDefaults.standard.synchronize()
  }

  private func checkAuthenticationStatus() {
    let sessionSecret = UserDefaults.standard.string(forKey: sessionKey)

    if let sessionSecret {
      APIClient.shared.setSession(sessionSecret)
      isAuthenticated = true
      loadUserInfo()
    } else {
      isAuthenticated = false
      user = nil
    }
  }

  private func validateSession() {
    Task {
      do {
        let user = try await Queries.getUserProfile()
        await MainActor.run {
          self.isAuthenticated = true
          self.user = user
        }
      } catch {
        await MainActor.run {
          self.clearInvalidSession()
        }
      }
    }
  }

  private func clearInvalidSession() {
    UserDefaults.standard.removeObject(forKey: sessionKey)
    APIClient.shared.setSession(nil)
    isAuthenticated = false
    user = nil
  }

  private func loadUserInfo() {
    if isAuthenticated {
      Task {
        do {
          let user = try await Queries.getUserProfile()
          await MainActor.run {
            self.user = user
            let savedAccountId = UserDefaults.standard.string(forKey: selectedAccountKey)
            if let savedAccountId,
            user.accounts.contains(where: { $0.id == savedAccountId }) {
              self.selectedAccountId = savedAccountId
            } else if let firstAccount = user.accounts.first {
              self.selectedAccountId = firstAccount.id
              UserDefaults.standard.set(firstAccount.id, forKey: selectedAccountKey)
            }
          }
        } catch {
          await MainActor.run {
            self.clearInvalidSession()
          }
        }
      }
    } else {
    }
  }

  func signIn() async {
    isAuthenticating = true

    do {
      let success = try await performAuthentication(isSignUp: false)
      await MainActor.run {
        if success {
          self.isAuthenticated = true
          self.loadUserInfo()
        }
        isAuthenticating = false
      }
    } catch {
      await MainActor.run {
        isAuthenticating = false
      }
    }
  }

  func signUp() async {
    isAuthenticating = true

    do {
      let success = try await performAuthentication(isSignUp: true)
      await MainActor.run {
        if success {
          self.isAuthenticated = true
          self.loadUserInfo()
        }
        isAuthenticating = false
      }
    } catch {
      await MainActor.run {
        isAuthenticating = false
      }
    }
  }

  func signOut() {
    UserDefaults.standard.removeObject(forKey: sessionKey)
    UserDefaults.standard.removeObject(forKey: selectedAccountKey)
    APIClient.shared.setSession(nil)
    isAuthenticated = false
    user = nil
    selectedAccountId = nil
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
        continuation.resume(throwing: AuthError.invalidURL)
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
          continuation.resume(throwing: AuthError.noSessionSecret)
          return
        }

        UserDefaults.standard.set(sessionSecret, forKey: sessionKey)
        APIClient.shared.setSession(sessionSecret)
        continuation.resume(returning: true)
      }

      session.presentationContextProvider = presentationContext
      session.prefersEphemeralWebBrowserSession = true
      session.start()
    }
  }

  private func getURLScheme() -> String {
    guard let urlTypes = Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") as? [[String: Any]] else {
      return DEV_LAUNCHER_DEFAULT_SCHEME
    }

    return urlTypes.compactMap { urlType in
      (urlType["CFBundleURLSchemes"] as? [String])?.first
    }.first ?? DEV_LAUNCHER_DEFAULT_SCHEME
  }
}

private class DevLauncherAuthPresentationContext: NSObject, ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    let window = UIApplication.shared.windows.first { $0.isKeyWindow }
    return window ?? ASPresentationAnchor()
  }
}
