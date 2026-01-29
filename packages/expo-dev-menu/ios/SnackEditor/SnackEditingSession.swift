// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Manages the active snack editing session.
/// This singleton bridges Expo Go (which opens snacks) and the dev menu (which edits them).
/// When a published snack is opened, Expo Go sets up a session here that the dev menu can use.
public class SnackEditingSession {
  public static let shared = SnackEditingSession()

  // MARK: - Properties

  /// The current channel ID
  public private(set) var channel: String?

  /// The snack identifier (e.g., @username/snackname)
  public private(set) var snackId: String?

  /// The session client connected to Snackpub
  public private(set) var sessionClient: SnackSessionClient?

  /// Whether the session is ready to respond to RESEND_CODE
  public private(set) var isReady: Bool = false

  /// Error if session setup failed
  public private(set) var setupError: Error?

  private init() {}

  // MARK: - Public Methods

  /// Sets up a new editing session for a published snack.
  /// This should be called before opening the snack URL.
  /// - Parameters:
  ///   - snackId: The snack identifier (e.g., @username/snackname)
  ///   - channel: The generated channel ID
  ///   - isStaging: Whether to use staging Snackpub
  public func setupSession(snackId: String, channel: String, isStaging: Bool) async {
    // Clear any existing session
    clearSession()

    self.snackId = snackId
    self.channel = channel
    self.setupError = nil

    do {
      // Fetch snack code and dependencies from API
      let (files, dependencies) = try await fetchSnackCode(snackId: snackId, isStaging: isStaging)

      // Create session client in host mode
      let client = SnackSessionClient(
        channel: channel,
        isStaging: isStaging,
        hostedFiles: files,
        hostedDependencies: dependencies
      )

      self.sessionClient = client

      // Connect to Snackpub
      await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
        client.connectAsHost(
          onReady: {
            self.isReady = true
            continuation.resume()
          },
          onError: { error in
            self.setupError = error
            continuation.resume()
          }
        )
      }
    } catch {
      self.setupError = error
    }
  }

  /// Gets the current files in the session
  public var currentFiles: [String: SnackSessionClient.SnackFile]? {
    return sessionClient?.currentFiles
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
