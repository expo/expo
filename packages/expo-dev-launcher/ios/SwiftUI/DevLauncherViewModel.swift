// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation
import AuthenticationServices
import Network
import EXDevMenu

private let selectedAccountKey = "expo-selected-account-id"
private let sessionKey = "expo-session-secret"

private let DEV_LAUNCHER_DEFAULT_SCHEME = "expo-dev-launcher"
private let BONJOUR_TYPE = "_expo._tcp"
private let networkPermissionGrantedKey = "expo.devlauncher.hasGrantedNetworkPermission"

/// How often we re-resolve the currently advertised servers. Each tick re-probes
/// every browsed endpoint's `/status`, so a server that stopped falls out of the
/// list within one interval and a server that started is picked up just as fast.
private let reconcileInterval: Duration = .seconds(3)

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
      DevMenuManager.shared.setMotionGestureEnabled(shakeDevice)
    }
  }
  @Published var threeFingerLongPress = false {
    didSet {
      // Route through DevMenuManager so the recognizer is installed/uninstalled immediately
      DevMenuManager.shared.setTouchGestureEnabled(threeFingerLongPress)
    }
  }
  @Published var showOnLaunch = false {
    didSet {
      // Route through DevMenuManager so the auto-launch observer is refreshed immediately
      DevMenuManager.shared.setShowsAtLaunch(showOnLaunch)
    }
  }
  @Published var isAuthenticated = false
  @Published var isAuthenticating = false
  @Published var user: User?
  @Published var selectedAccountId: String?
  @Published var isLoadingServer: Bool = false
  @Published var isLoadingLocalBundle: Bool = false
  @Published var permissionStatus: LocalNetworkPermissionStatus = .unknown
  @Published var devServers: [DevServer] = []

  private var browser: NWBrowser?
  private var reconcileTask: Task<Void, Never>?

  /// Bumped at the start of every `reconcile()`. Reconciles can overlap (timer
  /// tick, browse callback, pull-to-refresh), so a slower pass over a now-stale
  /// browsed set must not publish after a newer pass has started. Each reconcile
  /// captures this on entry and refuses to publish if it's been superseded.
  private var reconcileGeneration = 0

  /// The full set of endpoints the browser currently advertises, refreshed on
  /// every browse callback. The reconcile loop reads this each tick.
  private var browsedResults: [DiscoveryResult] = []

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

  var hasEmbeddedBundle: Bool {
    guard let enabled = Bundle.main.object(forInfoDictionaryKey: "EXDevClientEmbeddedBundle") as? Bool, enabled else {
      return false
    }
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle") != nil
  }

  init() {
    loadData()
    checkAuthenticationStatus()
    checkForStoredCrashes()
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
      onError: { [weak self] error in
        let message = DevLauncherLoadErrorMessage.message(for: error as NSError, url: url)
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

  func loadLocalBundle() {
    guard !isLoadingLocalBundle else { return }
    isLoadingLocalBundle = true

    EXDevLauncherController.sharedInstance().loadLocalBundle(onSuccess: { [weak self] in
      DispatchQueue.main.async {
        self?.isLoadingLocalBundle = false
      }
    }, onError: { [weak self] error in
      DispatchQueue.main.async {
        self?.isLoadingLocalBundle = false
        self?.showErrorAlert(error.localizedDescription)
      }
    })
  }

  func isCompatibleRuntime(_ runtimeVersion: String) -> Bool {
    return runtimeVersion == structuredBuildInfo.runtimeVersion
  }

  // MARK: - Dev server discovery
  //
  // Detection is poll-based rather than purely event-driven. `NWBrowser` only
  // tells us when records change, and a stopped dev server often never emits an
  // mDNS goodbye (and the simulator caches records), so the only reliable way to
  // know a server is still up (or gone) is to keep probing its `/status`
  // endpoint. A reconcile loop re-resolves the full browsed set on a fixed
  // cadence: a newly started server appears within one tick, a stopped one drops
  // out once its probe fails.

  func startServerDiscovery() {
    // Restart unless the browser is genuinely active. A browser stuck in
    // `.waiting`/`.failed` (e.g. after a permission grant or network change)
    // must be recreated, otherwise discovery wedges permanently.
    if let browser, browser.state == .ready || browser.state == .setup {
      return
    }

    stopServerDiscovery()
    startDevServerBrowser()
    startReconcileLoop()
  }

  func stopServerDiscovery() {
    reconcileTask?.cancel()
    browser?.cancel()
    reconcileTask = nil
    browser = nil
    browsedResults = []
  }

  func refreshDevServers() async {
    await reconcile()
  }

  func markNetworkPermissionGranted() {
    guard permissionStatus != .granted else {
      return
    }
    UserDefaults.standard.set(true, forKey: networkPermissionGrantedKey)
    permissionStatus = .granted
  }

  var hasGrantedNetworkPermission: Bool {
    return UserDefaults.standard.bool(forKey: networkPermissionGrantedKey)
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
        guard !done else {
          return
        }
        if !results.isEmpty {
          done = true
          continuation.resume(returning: true)
          browser.cancel()
          listener?.cancel()
        }
      }

      browser.stateUpdateHandler = { state in
        guard !done else {
          return
        }
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
        guard !done else {
          return
        }
        done = true
        continuation.resume(returning: false)
        browser.cancel()
        listener?.cancel()
      }
    }
  }

  private func startDevServerBrowser() {
    let params = NWParameters()
    params.includePeerToPeer = true
    params.allowLocalEndpointReuse = true

    browser = NWBrowser(
      for: NWBrowser.Descriptor.bonjourWithTXTRecord(type: BONJOUR_TYPE, domain: nil),
      using: params
    )

    browser?.stateUpdateHandler = { [weak self] state in
      Task { @MainActor [weak self] in
        guard let self else {
          return
        }
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
      Task { @MainActor [weak self, results] in
        guard let self else {
          return
        }
        self.markNetworkPermissionGranted()
        // Store the full current set (not just the delta) and resolve it right
        // away so newly advertised servers show up without waiting a tick.
        self.browsedResults = results.map { result in
          DiscoveryResult(
            name: NetworkUtilities.getNWBrowserResultName(result),
            endpoint: result.endpoint
          )
        }
        await self.reconcile()
      }
    }

    browser?.start(queue: DispatchQueue(label: "expo.devlauncher.discovery"))
  }

  private func startReconcileLoop() {
    reconcileTask?.cancel()
    reconcileTask = Task { [weak self] in
      while !Task.isCancelled {
        await self?.reconcile()
        try? await Task.sleep(for: reconcileInterval)
      }
    }
  }

  /// Re-probe every advertised endpoint and publish only the ones currently
  /// reachable. A full replace is correct here because we resolve the entire
  /// browsed set each pass: a stopped server fails its `/status` probe and drops
  /// out, a started one resolves and appears.
  private func reconcile() async {
    reconcileGeneration += 1
    let generation = reconcileGeneration
    let results = browsedResults

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
    // A newer reconcile started while we were probing, so its (fresher) browsed
    // set supersedes ours. Bail rather than overwrite it with a stale list.
    guard generation == reconcileGeneration else {
      return
    }

    updateDevServers(discoveredServers)
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

  private func updateDevServers(_ servers: [DevServer]) {
    let sorted = servers.sorted(by: <)
    // Avoid republishing an unchanged list so the view doesn't redraw every tick.
    // `DevServer.==` compares the url alone, so compare the displayed fields too:
    // a server can keep its url while advertising a new name (description).
    let unchanged = sorted.count == devServers.count
      && zip(sorted, devServers).allSatisfy { new, old in
        new.url == old.url && new.description == old.description && new.source == old.source
      }
    guard !unchanged else {
      return
    }
    devServers = sorted
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
