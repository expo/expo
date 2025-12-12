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

  private var cancellables = Set<AnyCancellable>()
  private let persistenceManager = PersistenceManager.shared

  var user: UserActor? { authService.user }
  var selectedAccountId: String? { authService.selectedAccountId }
  var isAuthenticating: Bool { authService.isAuthenticating }
  var isAuthenticated: Bool { authService.isAuthenticated }
  var selectedAccount: Account? { authService.selectedAccount }
  var isLoggedIn: Bool { authService.isLoggedIn }

  var developmentServers: [DevelopmentServer] { serverService.developmentServers }
  var projects: [ExpoProject] { dataService.projects }
  var snacks: [Snack] { dataService.snacks }
  var isLoadingData: Bool { dataService.isLoadingData }
  var dataError: APIError? { dataService.dataError }

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
    let newApp = RecentlyOpenedApp(
      name: name,
      url: url,
      timestamp: Date(),
      isEasUpdate: false,
      iconUrl: iconUrl
    )

    recentlyOpenedApps.removeAll { $0.url == url }
    recentlyOpenedApps.insert(newApp, at: 0)

    if recentlyOpenedApps.count > 10 {
      recentlyOpenedApps = Array(recentlyOpenedApps.prefix(10))
    }

    persistenceManager.saveRecentlyOpened(recentlyOpenedApps)
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
    authService.objectWillChange
      .sink { [weak self] _ in
        self?.objectWillChange.send()
      }
      .store(in: &cancellables)

    dataService.objectWillChange
      .sink { [weak self] _ in
        self?.objectWillChange.send()
      }
      .store(in: &cancellables)

    serverService.objectWillChange
      .sink { [weak self] _ in
        self?.objectWillChange.send()
      }
      .store(in: &cancellables)

    settingsManager.objectWillChange
      .sink { [weak self] _ in
        self?.objectWillChange.send()
      }
      .store(in: &cancellables)

    authService.$user
      .combineLatest(authService.$selectedAccountId)
      .sink { [weak self] user, selectedAccountId in
        guard let self = self,
              let user = user,
              let selectedAccountId = selectedAccountId,
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
  let iconUrl: String?
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
