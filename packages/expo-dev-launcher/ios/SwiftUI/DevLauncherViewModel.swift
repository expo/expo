// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation
import AuthenticationServices

private let DEV_LAUNCHER_DEFAULT_SCHEME = "expo-dev-launcher"

struct DevServer {
  let url: String
  let description: String
  let source: String
}

@MainActor
class DevLauncherViewModel: ObservableObject {
  @Published var recentlyOpenedApps: [RecentlyOpenedApp] = []
  @Published var buildInfo: [AnyHashable: Any] = [:]
  @Published var devServers: [DevServer] = []
  @Published var isDiscoveringServers = false
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
  @Published var userInfo: [String: Any]?
  @Published var isAuthenticating = false

  private let presentationContext = DevLauncherAuthPresentationContext()

  init() {
    loadData()
    discoverDevServers()
    checkAuthenticationStatus()
  }

  private func loadData() {
    let controller = EXDevLauncherController.sharedInstance()
    self.buildInfo = controller.getBuildInfo()
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
    guard let nsURL = URL(string: url) else {
      return
    }
    EXDevLauncherController.sharedInstance().loadApp(nsURL, onSuccess: nil, onError: nil)
  }

  func clearRecentlyOpenedApps() {
    EXDevLauncherController.sharedInstance().clearRecentlyOpenedApps()
    self.recentlyOpenedApps = []
  }

  func discoverDevServers() {
    isDiscoveringServers = true

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
        self.isDiscoveringServers = false
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

  func refreshDevServers() {
    discoverDevServers()
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

  // MARK: - Authentication

  private func checkAuthenticationStatus() {
    let sessionSecret = UserDefaults.standard.string(forKey: "expo-session-secret")
    isAuthenticated = sessionSecret != nil

    if isAuthenticated {
      loadUserInfo()
    }
  }

  private func loadUserInfo() {
    if isAuthenticated {
      userInfo = [
        "username": "User",
        "profilePhoto": ""
      ]
    }
  }

  func signIn() {
    isAuthenticating = true

    Task {
      do {
        let success = try await performAuthentication(isSignUp: false)
        await MainActor.run {
          if success {
            isAuthenticated = true
            loadUserInfo()
          }
          isAuthenticating = false
        }
      } catch {
        await MainActor.run {
          isAuthenticating = false
          print("Authentication error: \(error)")
        }
      }
    }
  }

  func signUp() {
    isAuthenticating = true

    Task {
      do {
        let success = try await performAuthentication(isSignUp: true)
        await MainActor.run {
          if success {
            isAuthenticated = true
            loadUserInfo()
          }
          isAuthenticating = false
        }
      } catch {
        await MainActor.run {
          isAuthenticating = false
          print("Authentication error: \(error)")
        }
      }
    }
  }

  func signOut() {
    UserDefaults.standard.removeObject(forKey: "expo-session-secret")
    UserDefaults.standard.synchronize()
    isAuthenticated = false
    userInfo = nil
  }

  private func performAuthentication(isSignUp: Bool) async throws -> Bool {
    return try await withCheckedThrowingContinuation { continuation in
      let websiteOrigin = "https://staging.expo.dev"
      let authType = isSignUp ? "signup" : "login"
      let scheme = getURLScheme()
      let redirectBase = "\(scheme)://auth"

      guard let encodedRedirectURI = redirectBase.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed),
        let url = URL(string: "\(websiteOrigin)/\(authType)?confirm_account=1&app_redirect_uri=\(encodedRedirectURI)") else {
        continuation.resume(throwing: NSError(domain: "AuthError", code: 1, userInfo: [NSLocalizedDescriptionKey: "Invalid auth URL"]))
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

        guard let callbackURL = callbackURL,
          let components = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false),
          let sessionSecret = components.queryItems?.first(where: { $0.name == "session_secret" })?.value else {
          continuation.resume(throwing: NSError(domain: "AuthError", code: 2, userInfo: [NSLocalizedDescriptionKey: "No session secret received"]))
          return
        }

        let decodedSessionSecret = sessionSecret.removingPercentEncoding ?? sessionSecret
        UserDefaults.standard.set(decodedSessionSecret, forKey: "expo-session-secret")
        UserDefaults.standard.synchronize()
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
