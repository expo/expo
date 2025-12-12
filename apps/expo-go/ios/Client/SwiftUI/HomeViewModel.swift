// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Combine

@MainActor
class HomeViewModel: ObservableObject {
  let authService: AuthenticationService
  let dataService: DataService
  let serverService: DevelopmentServerService
  let settingsManager: SettingsManager

  @Published var recentlyOpenedApps: [RecentlyOpenedApp] = []

  @Published var showingErrorAlert = false
  @Published var errorAlertMessage = ""
  @Published var showingAccountSheet = false
  @Published var networkError: APIError?
  @Published var showingNetworkError = false
  @Published var isNetworkAvailable = true

  @Published var user: UserActor?
  @Published var selectedAccountId: String?
  @Published var isAuthenticating = false
  @Published var isAuthenticated = false

  @Published var developmentServers: [DevelopmentServer] = []
  @Published var projects: [ExpoProject] = []
  @Published var snacks: [Snack] = []
  @Published var isLoadingData = false
  @Published var dataError: APIError?

  private var cancellables = Set<AnyCancellable>()
  private let persistenceManager = PersistenceManager.shared

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

  var shakeToShowDevMenu: Bool { settingsManager.shakeToShowDevMenu }
  var threeFingerLongPressEnabled: Bool { settingsManager.threeFingerLongPressEnabled }
  var selectedTheme: Int { settingsManager.selectedTheme }
  var buildInfo: [String: Any] { settingsManager.buildInfo }

  convenience init() {
    self.init(
      authService: AuthenticationService(),
      dataService: DataService(),
      serverService: DevelopmentServerService(),
      settingsManager: SettingsManager()
    )
  }

  init(
    authService: AuthenticationService,
    dataService: DataService,
    serverService: DevelopmentServerService,
    settingsManager: SettingsManager
  ) {
    self.authService = authService
    self.dataService = dataService
    self.serverService = serverService
    self.settingsManager = settingsManager

    loadRecentlyOpenedApps()
    setupSubscriptions()
    connectViewModelToBridge()
  }

  func onViewWillAppear() {
    serverService.startDiscovery()

    if isAuthenticated, let account = selectedAccount {
      dataService.startPolling(accountName: account.name)
    }

    Task {
      await refreshData()
    }
  }

  func onViewDidDisappear() {
    dataService.stopPolling()
    serverService.stopDiscovery()
  }

  func signIn() async {
    do {
      try await authService.signIn()
      if let account = selectedAccount {
        dataService.startPolling(accountName: account.name)
      }
    } catch {
      showErrorAlert("Failed to sign in")
    }
  }

  func signUp() async {
    do {
      try await authService.signUp()
      if let account = selectedAccount {
        dataService.startPolling(accountName: account.name)
      }
    } catch {
      showErrorAlert("Failed to sign up")
    }
  }

  func signOut() {
    authService.signOut()
    dataService.clearData()
    dataService.stopPolling()
  }

  func selectAccount(accountId: String) {
    authService.selectAccount(accountId: accountId)
    if let account = selectedAccount {
      dataService.startPolling(accountName: account.name)
    }
  }

  func refreshData() async {
    guard let account = selectedAccount else { return }

    async let task = dataService.fetchProjectsAndData(accountName: account.name)
    serverService.discoverDevelopmentServers()

    await task
  }

  func addToRecentlyOpened(url: String, name: String, iconUrl: String? = nil) {
    let normalizedUrl = normalizeUrl(url)

    if let existingIndex = recentlyOpenedApps.firstIndex(where: {
      normalizeUrl($0.url) == normalizedUrl
    }) {
      let existingApp = recentlyOpenedApps[existingIndex]

      if existingApp.name == name && iconUrl != nil && existingApp.iconUrl == nil {
        var updatedApp = existingApp
        updatedApp.iconUrl = iconUrl
        recentlyOpenedApps[existingIndex] = updatedApp
        persistenceManager.saveRecentlyOpened(recentlyOpenedApps)
        return
      }

      recentlyOpenedApps.remove(at: existingIndex)
    }

    let newApp = RecentlyOpenedApp(
      name: name,
      url: url,
      timestamp: Date(),
      isEasUpdate: false,
      iconUrl: iconUrl
    )

    recentlyOpenedApps.insert(newApp, at: 0)

    if recentlyOpenedApps.count > 10 {
      recentlyOpenedApps = Array(recentlyOpenedApps.prefix(10))
    }

    persistenceManager.saveRecentlyOpened(recentlyOpenedApps)
  }

  private func normalizeUrl(_ url: String) -> String {
    guard let urlComponents = URLComponents(string: url) else {
      return url
    }

    // Build URL without scheme
    var components: [String] = []
    if let host = urlComponents.host {
      components.append(host)
    }
    if let port = urlComponents.port {
      components.append(":\(port)")
    }
    components.append(urlComponents.path)
    if let query = urlComponents.query {
      components.append("?\(query)")
    }

    return components.joined()
  }

  func clearRecentlyOpenedApps() {
    recentlyOpenedApps = []
    persistenceManager.saveRecentlyOpened([])
  }

  private func loadRecentlyOpenedApps() {
    recentlyOpenedApps = persistenceManager.loadRecentlyOpened()
      .sorted(by: { $0.timestamp > $1.timestamp })
  }

  func openApp(url: String) {
    openAppViaBridge(url: url)
  }

  func extractAppName(from url: String) -> String {
    guard let urlComponents = URL(string: url) else {
      return url
    }

    let pathComponents = urlComponents.path.components(separatedBy: "/").filter { !$0.isEmpty }
    if let lastComponent = pathComponents.last, !lastComponent.isEmpty, lastComponent != "@" {
      return lastComponent
    }

    if let host = urlComponents.host {
      if let port = urlComponents.port {
        return "\(host):\(port)"
      }
      return host
    }

    return url
  }

  func updateShakeGesture(_ enabled: Bool) {
    settingsManager.updateShakeGesture(enabled)
  }

  func updateThreeFingerGesture(_ enabled: Bool) {
    settingsManager.updateThreeFingerGesture(enabled)
  }

  func updateTheme(_ themeIndex: Int) {
    settingsManager.updateTheme(themeIndex)
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

  func showNetworkError(_ error: APIError) {
    networkError = error
    showingNetworkError = true
  }

  func clearNetworkError() {
    networkError = nil
    showingNetworkError = false
  }

  private func setupSubscriptions() {
    authService.$user
      .sink { [weak self] in self?.user = $0 }
      .store(in: &cancellables)

    authService.$selectedAccountId
      .sink { [weak self] in self?.selectedAccountId = $0 }
      .store(in: &cancellables)

    authService.$isAuthenticating
      .sink { [weak self] in self?.isAuthenticating = $0 }
      .store(in: &cancellables)

    authService.$isAuthenticated
      .sink { [weak self] in self?.isAuthenticated = $0 }
      .store(in: &cancellables)

    dataService.$projects
      .sink { [weak self] in self?.projects = $0 }
      .store(in: &cancellables)

    dataService.$snacks
      .sink { [weak self] in self?.snacks = $0 }
      .store(in: &cancellables)

    dataService.$isLoadingData
      .sink { [weak self] in self?.isLoadingData = $0 }
      .store(in: &cancellables)

    dataService.$dataError
      .sink { [weak self] in self?.dataError = $0 }
      .store(in: &cancellables)

    serverService.$developmentServers
      .sink { [weak self] in self?.developmentServers = $0 }
      .store(in: &cancellables)

    settingsManager.objectWillChange
      .sink { [weak self] _ in
        self?.objectWillChange.send()
      }
      .store(in: &cancellables)

    authService.$user
      .combineLatest(authService.$selectedAccountId)
      .sink { [weak self] user, selectedAccountId in
        guard let self, let user, let selectedAccountId,
          let account = user.accounts.first(where: { $0.id == selectedAccountId }) else {
          return
        }
        self.dataService.startPolling(accountName: account.name)
      }
      .store(in: &cancellables)
  }
}

struct RecentlyOpenedApp: Identifiable, Codable {
  var id = UUID()
  let name: String
  let url: String
  let timestamp: Date
  let isEasUpdate: Bool
  var iconUrl: String?
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
  let latestUpdateUrl: String?
  let firstTwoBranches: [Branch]
}

enum ExpoGoError: Error {
  case invalidURL
  case noSessionSecret
  case notImplemented(String)
}
