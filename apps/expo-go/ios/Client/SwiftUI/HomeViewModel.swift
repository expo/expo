// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import AuthenticationServices
import Combine

private let sessionKey = "expo-session-secret"
private let selectedAccountKey = "expo-selected-account-id"
private let PROJECT_UPDATE_INTERVAL: TimeInterval = 10.0

@MainActor
class HomeViewModel: ObservableObject {
  @Published var recentlyOpenedApps: [RecentlyOpenedApp] = []
  @Published var developmentServers: [DevelopmentServer] = []
  @Published var projects: [ExpoProject] = []
  @Published var snacks: [ExpoSnack] = []
  @Published var isAuthenticating = false
  @Published var user: ExpoUser?
  @Published var selectedAccountId: String?
  @Published var isNetworkAvailable = true
  @Published var showingErrorAlert = false
  @Published var errorAlertMessage = ""
  @Published var showingAccountSheet = false
  @Published var shakeToShowDevMenu = true
  @Published var threeFingerLongPressEnabled = true
  @Published var buildInfo: [String: Any] = [:]
  @Published var selectedTheme = 0

  private var serverDiscoveryCancellables = Set<AnyCancellable>()
  private var projectPollingCancellables = Set<AnyCancellable>()

  private let presentationContext = ExpoGoAuthPresentationContext()

  var isAuthenticated: Bool {
    let sessionSecret = UserDefaults.standard.string(forKey: sessionKey)
    return sessionSecret != nil && !sessionSecret!.isEmpty
  }

  var selectedAccount: ExpoAccount? {
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
    loadInitialData()
    checkAuthenticationStatus()
  }

  func onViewWillAppear() {
    if isAuthenticated {
      startProjectPolling()
    }
    startServerDiscovery()
    Task {
      await refreshData()
    }
  }

  func onViewDidDisappear() {
    stopProjectPolling()
    stopServerDiscovery()
  }

  func refreshData() async {

  }

  func openApp(url: String) {
    openAppViaBridge(url: url)
  }

  func clearRecentlyOpenedApps() {
    recentlyOpenedApps = []
  }

  func signIn() async {
    isAuthenticating = true

    do {
      let success = try await performAuthentication(isSignUp: false)
      if success {
        await loadUserInfo()
        startProjectPolling()
      }
    } catch {
      showErrorAlert("Failed to sign in")
    }

    isAuthenticating = false
  }

  func signOut() {
    UserDefaults.standard.removeObject(forKey: sessionKey)
    UserDefaults.standard.removeObject(forKey: selectedAccountKey)
    user = nil
    selectedAccountId = nil
    projects = []
    snacks = []
    stopProjectPolling()
  }

  func signUp() async {
    isAuthenticating = true

    do {
      let success = try await performAuthentication(isSignUp: true)
      if success {
        await loadUserInfo()
        startProjectPolling()
      }
    } catch {
      showErrorAlert("Failed to sign up")
    }

    isAuthenticating = false
  }

  func selectAccount(accountId: String) {
    selectedAccountId = accountId
    UserDefaults.standard.set(accountId, forKey: selectedAccountKey)
  }

  func showAccountSheet() {
    showingAccountSheet = true
  }

  func showErrorAlert(_ message: String) {
    errorAlertMessage = message
    showingErrorAlert = true
  }

  func dismissErrorAlert() {
    errorAlertMessage = ""
    showingErrorAlert = false
  }

  private func loadInitialData() {
    loadRecentlyOpenedApps()
    loadDevSettings()
    loadBuildInfo()
    loadThemeSettings()
  }

  private func loadRecentlyOpenedApps() {
    recentlyOpenedApps = []
  }

  private func checkAuthenticationStatus() {
    if isAuthenticated {
      // TODO: Set session in API client
      Task {
        await loadUserInfo()
      }
    } else {
      user = nil
    }
  }

  private func loadUserInfo() async {
    guard isAuthenticated else { return }

    user = ExpoUser(
      id: "placeholder",
      username: "user",
      accounts: []
    )
  }

  private func startProjectPolling() {
    guard isAuthenticated else { return }
    stopProjectPolling()

    Task {
      await fetchProjectsAndData()
    }

    Timer.publish(every: PROJECT_UPDATE_INTERVAL, on: .main, in: .common)
      .autoconnect()
      .receive(on: DispatchQueue.global(qos: .background))
      .sink { [weak self] _ in
        Task {
          await self?.fetchProjectsAndData()
        }
      }
      .store(in: &projectPollingCancellables)
  }

  private func stopProjectPolling() {
    projectPollingCancellables.removeAll()
  }

  private func fetchProjectsAndData() async {
    guard isAuthenticated else { return }

    await MainActor.run {
      self.projects = []
      self.snacks = []
    }
  }

  func startServerDiscovery() {
    stopServerDiscovery()
    discoverDevelopmentServers()

    Timer.publish(every: 2.0, on: .main, in: .common)
      .autoconnect()
      .receive(on: DispatchQueue.global(qos: .background))
      .sink { [weak self] _ in
        self?.discoverDevelopmentServers()
      }
      .store(in: &serverDiscoveryCancellables)
  }

  func stopServerDiscovery() {
    serverDiscoveryCancellables.removeAll()
  }

  func discoverDevelopmentServers() {
    Task {
      var discoveredServers: [DevelopmentServer] = []
      // swiftlint:disable number_separator
      let portsToCheck = [8081, 8082, 8083, 8084, 8085, 19000, 19001, 19002]
      // swiftlint:enable number_separator
      let baseAddress = "http://localhost"

      await withTaskGroup(of: DevelopmentServer?.self) { group in
        for port in portsToCheck {
          group.addTask {
            await self.checkDevelopmentServer(url: "\(baseAddress):\(port)")
          }
        }

        for await server in group {
          if let server = server {
            discoveredServers.append(server)
          }
        }
      }

      await MainActor.run {
        self.developmentServers = discoveredServers.sorted { $0.url < $1.url }
      }
    }
  }

  private func checkDevelopmentServer(url: String) async -> DevelopmentServer? {
    guard let statusURL = URL(string: "\(url)/status") else {
      return nil
    }

    do {
      let (data, response) = try await URLSession.shared.data(from: statusURL)

      if let httpResponse = response as? HTTPURLResponse,
         httpResponse.statusCode == 200 {
        if let statusString = String(data: data, encoding: .utf8),
           statusString.contains("packager-status:running") {
          return DevelopmentServer(
            url: url,
            description: url,
            source: "local",
            isRunning: true
          )
        }
      }
    } catch {
      // Server not running or not reachable
    }

    return nil
  }

  private func performAuthentication(isSignUp: Bool) async throws -> Bool {
    return try await withCheckedThrowingContinuation { continuation in
      let websiteOrigin = "https://expo.dev"
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

        UserDefaults.standard.set(sessionSecret, forKey: sessionKey)
        // TODO: Set session in API client
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

  func addToRecentlyOpened(url: String, name: String) {
    let newApp = RecentlyOpenedApp(
      name: name,
      url: url,
      timestamp: Date(),
      isEasUpdate: false
    )

    recentlyOpenedApps.removeAll { $0.url == url }

    recentlyOpenedApps.insert(newApp, at: 0)

    if recentlyOpenedApps.count > 10 {
      recentlyOpenedApps = Array(recentlyOpenedApps.prefix(10))
    }

    // TODO: Persist to storage
  }

  func extractAppName(from url: String) -> String {
    return URL(string: url)?.host ?? url
  }

  func updateShakeGesture(_ enabled: Bool) {
    shakeToShowDevMenu = enabled
    saveDevSetting(key: "shakeToShow", value: enabled)
  }

  func updateThreeFingerGesture(_ enabled: Bool) {
    threeFingerLongPressEnabled = enabled
    saveDevSetting(key: "threeFingerLongPress", value: enabled)
  }

  func updateTheme(_ themeIndex: Int) {
    selectedTheme = themeIndex
    UserDefaults.standard.set(themeIndex, forKey: "ExpoGoSelectedTheme")
    applyThemeChange(themeIndex)
  }

  private func loadDevSettings() {
    let devMenuDefaults = UserDefaults.standard.dictionary(forKey: "RCTDevMenu") ?? [:]

    shakeToShowDevMenu = devMenuDefaults["shakeToShow"] as? Bool ?? true
    threeFingerLongPressEnabled = devMenuDefaults["threeFingerLongPress"] as? Bool ?? true
  }

  private func saveDevSetting(key: String, value: Bool) {
    var devMenuSettings = UserDefaults.standard.dictionary(forKey: "RCTDevMenu") ?? [:]
    devMenuSettings[key] = value
    UserDefaults.standard.set(devMenuSettings, forKey: "RCTDevMenu")
  }

  private func loadBuildInfo() {
    let buildConstants = EXBuildConstants.sharedInstance()
    let versions = EXVersions.sharedInstance()

    buildInfo = [
      "appName": Bundle.main.infoDictionary?["CFBundleDisplayName"] ?? "Expo Go",
      "appVersion": getFormattedAppVersion(),
      "expoRuntimeVersion": buildConstants?.expoRuntimeVersion ?? "Unknown",
      "supportedExpoSdks": versions.sdkVersion,
      "appIcon": getAppIcon()
    ]
  }

  private func getAppIcon() -> String {
    var appIcon = ""
    var appIconName: String?

    if let bundleIcons = Bundle.main.infoDictionary?["CFBundleIcons"] as? [String: Any],
       let primaryIcon = bundleIcons["CFBundlePrimaryIcon"] as? [String: Any],
       let iconFiles = primaryIcon["CFBundleIconFiles"] as? [String] {
      appIconName = iconFiles.last
    }

    if let appIconName, let resourcePath = Bundle.main.resourcePath {
      let appIconPath = "\(resourcePath)/\(appIconName).png"
      appIcon = "file://\(appIconPath)"
    }

    return appIcon
  }

  private func getFormattedAppVersion() -> String {
    let shortVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "Unknown"
    let buildVersion = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "Unknown"
    return "\(shortVersion) (\(buildVersion))"
  }

  private func loadThemeSettings() {
    selectedTheme = UserDefaults.standard.integer(forKey: "ExpoGoSelectedTheme")
  }

  private func applyThemeChange(_ themeIndex: Int) {
    DispatchQueue.main.async {
      guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else { return }

      // Animate the theme transition
      UIView.transition(with: windowScene.windows.first ?? UIView(), duration: 0.3, options: .transitionCrossDissolve) {
        switch themeIndex {
        case 0: // Automatic
          windowScene.windows.first?.overrideUserInterfaceStyle = .unspecified
        case 1: // Light
          windowScene.windows.first?.overrideUserInterfaceStyle = .light
        case 2: // Dark
          windowScene.windows.first?.overrideUserInterfaceStyle = .dark
        default:
          windowScene.windows.first?.overrideUserInterfaceStyle = .unspecified
        }
      }
    }
  }
}

struct RecentlyOpenedApp: Identifiable, Codable {
  var id = UUID()
  let name: String
  let url: String
  let timestamp: Date
  let isEasUpdate: Bool
}

struct DevelopmentServer: Identifiable {
  var id = UUID()
  let url: String
  let description: String
  let source: String
  let isRunning: Bool
}

struct ExpoProject: Identifiable, Codable {
  let id: String
  let name: String
  let fullName: String
  let description: String?
}

struct ExpoSnack: Identifiable, Codable {
  let id: String
  let name: String
  let description: String?
}

struct ExpoUser: Codable {
  let id: String
  let username: String
  let accounts: [ExpoAccount]
}

struct ExpoAccount: Identifiable, Codable {
  let id: String
  let name: String
}

enum ExpoGoError: Error {
  case invalidURL
  case noSessionSecret
  case notImplemented(String)
}

private class ExpoGoAuthPresentationContext: NSObject, ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    let window = UIApplication.shared.windows.first { $0.isKeyWindow }
    return window ?? ASPresentationAnchor()
  }
}
