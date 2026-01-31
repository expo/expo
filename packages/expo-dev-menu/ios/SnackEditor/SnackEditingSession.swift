// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Manages the active snack editing session.
/// This singleton bridges Expo Go (which opens snacks) and the dev menu (which edits them).
/// When a published snack is opened, Expo Go sets up a session here that the dev menu can use.
public class SnackEditingSession {
  public static let shared = SnackEditingSession()

  /// Notification posted when session state changes (ready/cleared)
  public static let sessionDidChangeNotification = Notification.Name("SnackEditingSessionDidChange")

  // MARK: - Properties

  /// The current channel ID
  public private(set) var channel: String?

  /// The snack identifier (e.g., @username/snackname)
  public private(set) var snackId: String?

  /// The session client connected to Snackpub
  public private(set) var sessionClient: SnackSessionClient?

  /// Whether the session is ready to respond to RESEND_CODE
  public private(set) var isReady: Bool = false {
    didSet {
      if isReady != oldValue {
        NotificationCenter.default.post(name: Self.sessionDidChangeNotification, object: nil)
      }
    }
  }

  /// Error if session setup failed
  public private(set) var setupError: Error?

  private init() {}

  // MARK: - Public Methods

  /// Sets up a new editing session for a published snack.
  /// This fetches code from the Snack API and sets up a host session.
  /// - Parameters:
  ///   - snackId: The snack identifier (e.g., @username/snackname)
  ///   - channel: The generated channel ID
  ///   - isStaging: Whether to use staging Snackpub
  public func setupSession(snackId: String, channel: String, isStaging: Bool) async {
    // Clear any existing session first (before fetch, in case fetch fails)
    clearSession()

    // Set these early so they're available even if fetch fails
    self.snackId = snackId
    self.channel = channel

    do {
      // Fetch snack code and dependencies from API
      let (files, dependencies) = try await fetchSnackCode(snackId: snackId, isStaging: isStaging)

      // Set up session with fetched code (pass clearFirst: false since we already cleared)
      await setupSessionWithCode(
        snackId: snackId,
        code: files,
        dependencies: dependencies,
        channel: channel,
        isStaging: isStaging,
        clearFirst: false
      )
    } catch {
      self.setupError = error
    }
  }

  /// Sets up an editing session with provided code.
  /// This is the core method - setupSession calls this after fetching code from API.
  /// - Parameters:
  ///   - snackId: Optional snack ID (use "new" for new playgrounds)
  ///   - code: The code files to host
  ///   - dependencies: Dependencies to include (empty for new playgrounds)
  ///   - channel: The generated channel ID
  ///   - isStaging: Whether to use staging Snackpub
  ///   - clearFirst: Whether to clear existing session (false when called from setupSession which already cleared)
  public func setupSessionWithCode(
    snackId: String = "new",
    code: [String: SnackSessionClient.SnackFile],
    dependencies: [String: [String: Any]] = [:],
    channel: String,
    isStaging: Bool = false,
    clearFirst: Bool = true
  ) async {
    // Clear any existing session (unless caller already did)
    if clearFirst {
      clearSession()
    }

    self.snackId = snackId
    self.channel = channel
    self.setupError = nil

    // Create session client in host mode with provided code
    let client = SnackSessionClient(
      channel: channel,
      isStaging: isStaging,
      hostedFiles: code,
      hostedDependencies: dependencies
    )

    self.sessionClient = client

    // Connect to Snackpub
    // Use a flag to ensure the continuation is only resumed once.
    // Both onReady and onError can fire, and onError can fire after onReady
    // if the WebSocket disconnects later - we only want the first callback to resume.
    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      var hasResumed = false
      client.connectAsHost(
        onReady: {
          guard !hasResumed else { return }
          hasResumed = true
          self.isReady = true
          continuation.resume()
        },
        onError: { error in
          guard !hasResumed else { return }
          hasResumed = true
          self.setupError = error
          continuation.resume()
        }
      )
    }
  }

  /// Gets the current files in the session
  public var currentFiles: [String: SnackSessionClient.SnackFile]? {
    return sessionClient?.currentFiles
  }

  /// Resets files to original (discards edits). Call this on app reload.
  public func resetFiles() {
    sessionClient?.resetToOriginalFiles()
  }

  /// Clears the current session.
  /// Should be called when the snack is closed or a new snack is opened.
  public func clearSession() {
    sessionClient?.disconnect()
    sessionClient = nil
    channel = nil
    snackId = nil
    isReady = false
    setupError = nil
  }

  /// Checks if there's an active session for the given channel
  func hasActiveSession(forChannel channel: String) -> Bool {
    return self.channel == channel && isReady && sessionClient != nil
  }

  // MARK: - Private Methods

  /// Fetches snack code from the Snack API
  private func fetchSnackCode(snackId: String, isStaging: Bool) async throws -> (files: [String: SnackSessionClient.SnackFile], dependencies: [String: [String: Any]]) {
    let apiHost = isStaging ? "https://staging.exp.host" : "https://exp.host"

    // Handle @snack/ prefix
    let cleanId = snackId.hasPrefix("@snack/") ? String(snackId.dropFirst(7)) : snackId

    guard let apiURL = URL(string: "\(apiHost)/--/api/v2/snack/\(cleanId)") else {
      throw SnackEditingSessionError.invalidURL
    }

    var request = URLRequest(url: apiURL)
    request.setValue("3.0.0", forHTTPHeaderField: "Snack-Api-Version")
    request.setValue("expo-go/1.0", forHTTPHeaderField: "User-Agent")

    let (data, response) = try await URLSession.shared.data(for: request)

    if let httpResponse = response as? HTTPURLResponse,
       !(200...299).contains(httpResponse.statusCode) {
      throw SnackEditingSessionError.httpError(httpResponse.statusCode)
    }

    let snackResponse = try JSONDecoder().decode(SnackApiResponse.self, from: data)

    // Convert to SnackFile format
    var files: [String: SnackSessionClient.SnackFile] = [:]
    for (path, file) in snackResponse.code {
      files[path] = SnackSessionClient.SnackFile(
        path: path,
        contents: file.contents,
        isAsset: file.type == "ASSET"
      )
    }

    // Convert dependencies to full objects for CODE message protocol
    // Format: { name: { version, resolved, handle } }
    var dependencies: [String: [String: Any]] = [:]
    if let deps = snackResponse.dependencies {
      for (name, dep) in deps {
        var depObj: [String: Any] = ["version": dep.version]
        if let handle = dep.handle {
          depObj["handle"] = handle
          // Extract resolved version from handle (format: snackager-X/package@version)
          if let atIndex = handle.lastIndex(of: "@") {
            let resolved = String(handle[handle.index(after: atIndex)...])
            depObj["resolved"] = resolved
          } else {
            depObj["resolved"] = dep.version
          }
        }
        dependencies[name] = depObj
      }
    }

    return (files, dependencies)
  }
}

// MARK: - Error Types

enum SnackEditingSessionError: LocalizedError {
  case invalidURL
  case httpError(Int)
  case noFilesReceived

  var errorDescription: String? {
    switch self {
    case .invalidURL:
      return "Invalid Snack API URL"
    case .httpError(let code):
      return "Snack API returned error: \(code)"
    case .noFilesReceived:
      return "No files received from Snack API"
    }
  }
}

// MARK: - API Response Types

private struct SnackApiResponse: Codable {
  let id: String
  let hashId: String
  let code: [String: SnackApiFile]
  let dependencies: [String: SnackDependency]?

  struct SnackApiFile: Codable {
    let type: String  // "CODE" or "ASSET"
    let contents: String
  }

  struct SnackDependency: Codable {
    let version: String
    let handle: String?
    let peerDependencies: [String: String]?
  }
}
