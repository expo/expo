// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation
import AuthenticationServices
import Network

private let selectedAccountKey = "expo-selected-account-id"
private let sessionKey = "expo-session-secret"

private let DEV_LAUNCHER_DEFAULT_SCHEME = "expo-dev-launcher"
private let BONJOUR_TYPE = "_expo._tcp"
private let networkPermissionGrantedKey = "expo.devlauncher.hasGrantedNetworkPermission"

enum LocalNetworkPermissionStatus: Equatable, Sendable {
  case unknown
  case checking
  case granted
  case denied
}

@MainActor
class DevLauncherViewModel: ObservableObject {
  /// Safe area inset for when VC hierarchy doesn't propagate it (e.g., SwiftUI/brownfield apps)
  @Published var topSafeAreaInset: CGFloat = 0
  @Published var recentlyOpenedApps: [RecentlyOpenedApp] = []
  @Published var buildInfo: [AnyHashable: Any] = [:]
  @Published var updatesConfig: [AnyHashable: Any] = [:]
  @Published var currentError: EXDevLauncherAppError?
  @Published var showingCrashReport = false
  @Published var showingErrorAlert = false
  @Published var errorAlertMessage = ""
  @Published var storedCrashInstance: EXDevLauncherErrorInstance?
  @Published var hasStoredCrash = false
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
  @Published var isLoadingServer: Bool = false
  @Published var permissionStatus: LocalNetworkPermissionStatus = .unknown

  @Published var browserDevServers: [DevServer] = [] {
    didSet { updateDevServers() }
  }

  @Published var localDevServers: [DevServer] = [] {
    didSet { updateDevServers() }
  }

  @Published var devServers: [DevServer] = []

  private var browser: NWBrowser?
  private var pingTask: Task<Void, Never>?
  private var scanTask: Task<Void, Never>?

  #if !os(tvOS)
  private let presentationContext = DevLauncherAuthPresentationContext()
  #endif

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
    checkAuthenticationStatus()
    checkForStoredCrashes()
  }

  private func updateDevServers() {
    let allServers = browserDevServers + localDevServers
    var serversByPort: [String: DevServer] = [:]

    for server in allServers {
      guard let port = extractPort(from: server.url) else {
        serversByPort[server.url] = server
        continue
      }

      if let existing = serversByPort[port] {
        let existingHasName = existing.description != existing.url
        let newHasName = server.description != server.url

        if newHasName && !existingHasName {
          serversByPort[port] = server
        } else if existingHasName == newHasName {
          let existingIsLinkLocal = existing.url.contains("169.254.")
          let newIsLinkLocal = server.url.contains("169.254.")

          if existingIsLinkLocal && !newIsLinkLocal {
            serversByPort[port] = server
          }
        }
      } else {
        serversByPort[port] = server
      }
    }

    devServers = serversByPort.values.sorted(by: <)
  }

  private func extractPort(from url: String) -> String? {
    guard let urlComponents = URLComponents(string: url),
          let port = urlComponents.port else {
      return nil
    }
    return String(port)
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

    let allApps = apps.compactMap { app -> RecentlyOpenedApp? in
      guard let url = app["url"] as? String,
            let timestampInt64 = app["timestamp"] as? Int64 else {
        return nil
      }

      let name = app["name"] as? String ?? url
      let isEasUpdate = app["isEasUpdate"] as? Bool
      let timestamp = Date(timeIntervalSince1970: TimeInterval(timestampInt64))
      return RecentlyOpenedApp(name: name, url: url, timestamp: timestamp, isEasUpdate: isEasUpdate)
    }

    var appsByKey: [String: RecentlyOpenedApp] = [:]
    for app in allApps {
      let port = extractPort(from: app.url) ?? ""
      let key = "\(app.name):\(port)"

      if let existing = appsByKey[key] {
        if app.timestamp > existing.timestamp {
          appsByKey[key] = app
        }
      } else {
        appsByKey[key] = app
      }
    }

    self.recentlyOpenedApps = appsByKey.values.sorted { $0.timestamp > $1.timestamp }
  }

  func openApp(url: String) {
    guard let bundleUrl = URL(string: url) else {
      return
    }

    isLoadingServer = true

    EXDevLauncherController.sharedInstance().loadApp(
      bundleUrl,
      onSuccess: { [weak self] in
        DispatchQueue.main.async {
          self?.isLoadingServer = false
        }
      },
      onError: { [weak self] _ in
        let message = "Failed to connect to \(url)"
        DispatchQueue.main.async {
          self?.isLoadingServer = false
          self?.showErrorAlert(message)
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

  func startServerDiscovery() {
    if browser != nil {
      return
    }

    stopServerDiscovery()
    startDevServerBrowser()
    startLocalDevServerScanner()
  }
  
  func markNetworkPermissionGranted() {
    UserDefaults.standard.set(true, forKey: networkPermissionGrantedKey)
    permissionStatus = .granted
  }

  var hasGrantedNetworkPermission: Bool {
    UserDefaults.standard.bool(forKey: networkPermissionGrantedKey)
  }

  func refreshPermissionStatus() {
    permissionStatus = .checking
    Task {
      let hasAccess = await checkLocalNetworkAccess()
      permissionStatus = hasAccess ? .granted : .denied
    }
  }

  func checkLocalNetworkAccess() async -> Bool {
    let serviceType = BONJOUR_TYPE
    let queue = DispatchQueue(label: "expo.devlauncher.permissioncheck")

    return await withCheckedContinuation { continuation in
      var done = false

      let listener = try? NWListener(using: .tcp, on: .any)
      listener?.service = NWListener.Service(type: serviceType)
      listener?.stateUpdateHandler = { _ in }
      listener?.newConnectionHandler = { $0.cancel() }
      listener?.start(queue: queue)

      let browser = NWBrowser(for: .bonjour(type: serviceType, domain: nil), using: .tcp)
      browser.browseResultsChangedHandler = { results, _ in
        guard !done else { return }
        if !results.isEmpty {
          done = true
          continuation.resume(returning: true)
          browser.cancel()
          listener?.cancel()
        }
      }

      browser.stateUpdateHandler = { state in
        guard !done else { return }
        if case .waiting(let error) = state,
           case .dns(let dnsError) = error,
           dnsError == kDNSServiceErr_PolicyDenied {
          done = true
          continuation.resume(returning: false)
          browser.cancel()
          listener?.cancel()
        }
      }

      browser.start(queue: queue)

      queue.asyncAfter(deadline: .now() + 2) {
        guard !done else { return }
        done = true
        continuation.resume(returning: false)
        browser.cancel()
        listener?.cancel()
      }
    }
  }

  func stopServerDiscovery() {
    pingTask?.cancel()
    scanTask?.cancel()
    browser?.cancel()
    pingTask = nil
    scanTask = nil
    browser = nil
  }

  private func startLocalDevServerScanner() {
    scanTask?.cancel()
    scanTask = Task {
      await scanLocalDevServers()
      while !Task.isCancelled {
        try? await Task.sleep(nanoseconds: 2_000_000_000)
        if Task.isCancelled {
          break
        }
        await scanLocalDevServers()
      }
    }
  }

  private func startDevServerBrowser() {
    pingTask?.cancel()
    browser?.cancel()

    let params = NWParameters()
    params.includePeerToPeer = true
    params.allowLocalEndpointReuse = true

    browser = NWBrowser(
      for: NWBrowser.Descriptor.bonjourWithTXTRecord(type: BONJOUR_TYPE, domain: nil),
      using: params
    )

    browser?.stateUpdateHandler = { [weak self] state in
      Task { @MainActor [weak self] in
        guard let self else { return }
        switch state {
        case .waiting(let error):
          if case .dns(let dnsError) = error, dnsError == kDNSServiceErr_PolicyDenied {
            self.permissionStatus = .denied
          }
        case .failed(let error):
          if case .dns(let dnsError) = error, dnsError == kDNSServiceErr_PolicyDenied {
            self.permissionStatus = .denied
          }
        default:
          break
        }
      }
    }

    browser?.browseResultsChangedHandler = { [weak self] results, _ in
      guard let self else { return }
      Task { @MainActor [weak self, results] in
        guard let self else { return }
        self.markNetworkPermissionGranted()
        self.pingTask?.cancel()
        self.pingTask = Task {
          defer { self.pingTask = nil }
          await self.pingDiscoveryResults(results.map { result in
            DiscoveryResult(
              name: NetworkUtilities.getNWBrowserResultName(result),
              endpoint: result.endpoint
            )
          })
        }
      }
    }

    browser?.start(queue: DispatchQueue(label: "expo.devlauncher.discovery"))
  }

  private func scanLocalDevServers() async {
    guard !Task.isCancelled else {
      return
    }

    var discoveredServers: [DevServer] = []
    await withTaskGroup(of: DevServer?.self) { group in
      for result in NetworkUtilities.getLocalEndpointsToScan() {
        group.addTask {
          return await self.resolveDevServer(result)
        }
      }

      for await server in group {
        if let server {
          discoveredServers.append(server)
        }
      }
    }

    await MainActor.run {
      self.localDevServers = discoveredServers
    }
  }

  private func pingDiscoveryResults(_ results: [DiscoveryResult]) async {
    guard !Task.isCancelled else {
      return
    }

    var discoveredServers: [DevServer] = []
    await withTaskGroup(of: DevServer?.self) { group in
      for result in results {
        group.addTask {
          return await self.resolveDevServer(result)
        }
      }

      for await server in group {
        if let server {
          discoveredServers.append(server)
        }
      }
    }

    guard !Task.isCancelled else {
      return
    }

    await MainActor.run {
      self.browserDevServers = discoveredServers
    }
  }

  private func resolveDevServer(_ result: DiscoveryResult) async -> DevServer? {
    do {
      if let host = try await NetworkUtilities.resolveBundlerEndpoint(
        endpoint: result.endpoint,
        queue: DispatchQueue.main
      ) {
        return DevServer(
          url: host,
          description: result.name ?? host,
          source: "local"
        )
      }
    } catch {}

    return nil
  }

  func showError(_ error: EXDevLauncherAppError) {
    currentError = error
  }

  func showErrorAlert(_ message: String) {
    errorAlertMessage = message
    showingErrorAlert = true
  }

  func dismissErrorAlert() {
    errorAlertMessage = ""
    showingErrorAlert = false
  }

  func dismissCrashReport() {
    currentError = nil
    showingCrashReport = false
    storedCrashInstance = nil
    hasStoredCrash = false
  }

  func showCrashReport() {
    if let storedCrashInstance {
      let error = EXDevLauncherAppError(message: storedCrashInstance.message, stack: nil)
      currentError = error
      showingCrashReport = true
    }
  }

  private func loadMenuPreferences() {
    let defaults = UserDefaults.standard

    shakeDevice = defaults.object(forKey: "EXDevMenuMotionGestureEnabled") as? Bool ?? true
    threeFingerLongPress = defaults.object(forKey: "EXDevMenuTouchGestureEnabled") as? Bool ?? true
    showOnLaunch = defaults.object(forKey: "EXDevMenuShowsAtLaunch") as? Bool ?? false
  }

  private func saveMenuPreference(key: String, value: Bool) {
    UserDefaults.standard.set(value, forKey: key)
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

  private func clearInvalidSession() {
    UserDefaults.standard.removeObject(forKey: sessionKey)
    APIClient.shared.setSession(nil)
    isAuthenticated = false
    user = nil
  }

  private func loadUserInfo() {
    guard isAuthenticated else { return }

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
    clearRecentlyOpenedApps()
    isAuthenticated = false
    user = nil
    selectedAccountId = nil
  }

  func selectAccount(accountId: String) {
    selectedAccountId = accountId
    UserDefaults.standard.set(accountId, forKey: selectedAccountKey)
    clearRecentlyOpenedApps()
  }

  private func performAuthentication(isSignUp: Bool) async throws -> Bool {
    #if os(tvOS)
    throw Exception(name: "NotImplementedError", description: "Not implemented on tvOS")
    #else
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
    #endif
  }

  private func getURLScheme() -> String {
    guard let urlTypes = Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") as? [[String: Any]] else {
      return DEV_LAUNCHER_DEFAULT_SCHEME
    }

    return urlTypes.compactMap { urlType in
      (urlType["CFBundleURLSchemes"] as? [String])?.first
    }.first ?? DEV_LAUNCHER_DEFAULT_SCHEME
  }

  func checkForStoredCrashes() {
    let registry = EXDevLauncherErrorRegistry()
    storedCrashInstance = registry.consumeException()
    hasStoredCrash = storedCrashInstance != nil
  }
}

#if !os(tvOS)
private class DevLauncherAuthPresentationContext: NSObject, ASWebAuthenticationPresentationContextProviding {
  func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
    let window = UIApplication.shared.windows.first { $0.isKeyWindow }
    return window ?? ASPresentationAnchor()
  }
}
#endif
