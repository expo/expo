// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Combine

/// Manages the active snack editing session.
/// This singleton bridges Expo Go (which opens snacks) and the dev menu (which edits them).
/// When a published snack is opened, Expo Go sets up a session here that the dev menu can use.
///
/// @MainActor ensures all property access is on the main thread for thread safety.
/// SwiftUI views can observe @Published properties directly.
@MainActor
public class SnackEditingSession: ObservableObject {
  public static let shared = SnackEditingSession()

  /// Notification posted when code has been edited
  public static let codeDidChangeNotification = Notification.Name("SnackEditingSessionCodeDidChange")

  // MARK: - Published Properties (UI-affecting, observed by SwiftUI)

  /// Whether the session is ready to respond to RESEND_CODE
  @Published public private(set) var isReady: Bool = false

  /// The snack display name (fetched from API)
  @Published public private(set) var snackName: String?

  /// Whether this session is a lesson (for Expo Go Learn tab)
  @Published public private(set) var isLesson: Bool = false

  /// The lesson ID if this is a lesson session
  @Published public private(set) var lessonId: Int?

  /// The lesson description if this is a lesson session
  @Published public private(set) var lessonDescription: String?

  /// Whether the code has been edited since the session started
  @Published public private(set) var hasBeenEdited: Bool = false

  // MARK: - Non-Published Properties (internal state)

  /// The current channel ID
  public private(set) var channel: String?

  /// The snack identifier (e.g., @username/snackname)
  public private(set) var snackId: String?

  /// The transport connected to Snackpub (host or viewer mode)
  private(set) var transport: SnackpubTransport?

  /// Connection state of the transport, mirrored for synchronous UI reads
  @Published private(set) var connectionState: SnackpubTransport.ConnectionState = .disconnected

  /// MainActor mirrors of the transport's actor-isolated state
  private var mirroredFiles: [String: SnackFile]?
  private var transportEventsTask: Task<Void, Never>?
  private var firstFilesContinuation: CheckedContinuation<Void, Error>?

  /// Error if session setup failed
  public private(set) var setupError: Error?

  /// Whether this is an embedded session (lessons, playground, demo) that uses direct native transport
  public private(set) var isEmbeddedSession: Bool = false

  /// Files stored locally for embedded sessions (no Snackpub transport)
  private var embeddedFiles: [String: SnackFile]?

  /// Dependencies stored locally for embedded sessions
  private var embeddedDependencies: [String: [String: Any]] = [:]

  private init() {}

  // MARK: - Public Methods

  /// Sets up a new editing session for a published snack.
  /// This fetches code from the Snack API and sets up a host session.
  /// - Parameters:
  ///   - snackId: The snack identifier (e.g., @username/snackname)
  ///   - channel: The generated channel ID
  ///   - isStaging: Whether to use staging Snackpub
  ///   - name: Optional display name (if known, e.g., from GraphQL)
  public func setupSession(snackId: String, channel: String, isStaging: Bool, name: String? = nil) async {
    // Clear any existing session first (before fetch, in case fetch fails)
    clearSession()

    // Set these early so they're available even if fetch fails
    self.snackId = snackId
    self.channel = channel
    self.snackName = name

    do {
      // Fetch snack code and dependencies from API
      let (files, dependencies, fetchedName) = try await fetchSnackCode(snackId: snackId, isStaging: isStaging)

      // Use provided name, or fall back to fetched name from API
      if self.snackName == nil {
        self.snackName = fetchedName
      }

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
  ///   - isLesson: Whether this is a lesson session from Expo Go Learn tab
  ///   - lessonId: The lesson ID if this is a lesson session
  ///   - isEmbedded: Whether to use direct native transport instead of Snackpub WebSocket
  public func setupSessionWithCode(
    snackId: String = "new",
    code: [String: SnackFile],
    dependencies: [String: [String: Any]] = [:],
    channel: String,
    isStaging: Bool = false,
    clearFirst: Bool = true,
    isLesson: Bool = false,
    lessonId: Int? = nil,
    lessonDescription: String? = nil,
    isEmbedded: Bool = false
  ) async {
    // Clear any existing session (unless caller already did)
    if clearFirst {
      clearSession()
    }

    self.snackId = snackId
    self.channel = channel
    self.setupError = nil
    self.isLesson = isLesson
    self.lessonId = lessonId
    self.lessonDescription = lessonDescription

    if isEmbedded {
      // Embedded session: store files locally, skip Snackpub WebSocket entirely.
      // The snack runtime will communicate via SnackDirectTransport native module.
      self.isEmbeddedSession = true
      self.embeddedFiles = code
      self.embeddedDependencies = dependencies
      self.isReady = true
      // Set the static flag before createNewApp() starts React Native,
      // so the SnackDirectTransport module reads it as true during init.
      SnackDirectTransport.isEmbeddedSessionAvailable = true
      return
    }

    // Create and connect the host-mode transport. Timeout and reconnection
    // behavior live inside the transport.
    let transport = SnackpubTransport(
      channel: channel,
      isStaging: isStaging,
      mode: .host(files: code, dependencies: dependencies)
    )
    self.transport = transport
    self.mirroredFiles = code
    observeTransportEvents(transport)

    do {
      try await transport.connect()
      self.isReady = true
    } catch {
      self.setupError = error
    }
  }

  /// Joins an existing snack channel as a viewer (deep-linked snacks opened
  /// via snack.expo.dev, where Expo Go hosts no session of its own). Waits
  /// for the first CODE message so callers get files or an error.
  public func setupViewerSession(channel: String, isStaging: Bool) async throws {
    clearSession()
    self.channel = channel

    let transport = SnackpubTransport(channel: channel, isStaging: isStaging, mode: .viewer)
    self.transport = transport
    observeTransportEvents(transport)

    try await transport.connect()

    if mirroredFiles?.isEmpty == false {
      isReady = true
      return
    }

    let timeoutTask = Task { @MainActor in
      try? await Task.sleep(nanoseconds: 10_000_000_000)
      guard !Task.isCancelled else { return }
      self.firstFilesContinuation?.resume(throwing: SnackpubError.timeout)
      self.firstFilesContinuation = nil
    }

    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      self.firstFilesContinuation = continuation
    }
    timeoutTask.cancel()
    isReady = true
  }

  /// Sends a file edit through the active session. Returns false only when
  /// there is no session at all - a disconnected transport queues the edit
  /// and flushes it after reconnecting.
  public func sendFileUpdate(path: String, oldContents: String, newContents: String) -> Bool {
    if isEmbeddedSession {
      updateEmbeddedFile(path: path, oldContents: oldContents, newContents: newContents)
      return true
    }
    guard let transport else { return false }
    mirroredFiles?[path] = SnackFile(path: path, contents: newContents, isAsset: false)
    hasBeenEdited = true
    Task { await transport.sendFileUpdate(path: path, oldContents: oldContents, newContents: newContents) }
    return true
  }

  /// Mirrors transport events into MainActor state and reposts the session
  /// notifications (the transport itself knows nothing about this class).
  private func observeTransportEvents(_ transport: SnackpubTransport) {
    transportEventsTask = Task { [weak self] in
      for await event in transport.events {
        guard let self else { return }
        switch event {
        case .filesUpdated(let files):
          self.mirroredFiles = files
          self.firstFilesContinuation?.resume()
          self.firstFilesContinuation = nil
          NotificationCenter.default.post(name: Self.codeDidChangeNotification, object: nil)
        case .edited:
          self.hasBeenEdited = true
          NotificationCenter.default.post(name: Self.codeDidChangeNotification, object: nil)
        case .stateChanged(let state):
          self.connectionState = state
        }
      }
    }
  }

  /// Gets the current files in the session
  public var currentFiles: [String: SnackFile]? {
    if isEmbeddedSession {
      return embeddedFiles
    }
    return mirroredFiles
  }

  /// The display name for this snack, extracted from snackName or snackId
  public var displayName: String {
    // Prefer the fetched display name
    if let name = snackName, !name.isEmpty {
      return name
    }
    // Extract from snack ID
    if let id = snackId {
      if id == "new" {
        return "Playground"
      }
      if let lastSlash = id.lastIndex(of: "/") {
        return String(id[id.index(after: lastSlash)...])
      }
      return id
    }
    return "Playground"
  }

  /// Whether this is a lesson-like session (official lesson or snack with "lesson"/"learn"/"playground" in name)
  /// Official lessons don't need to wait for Snackpub connection - the lesson info is set upfront.
  /// For snacks detected by name, we need the session to be ready to have the display name.
  public var isLessonLikeSession: Bool {
    // Official lessons are known immediately (set before Snackpub connects)
    if isLesson { return true }
    // For name-based detection, need session to be ready
    guard isReady else { return false }
    return displayName.localizedCaseInsensitiveContains("lesson") ||
           displayName.localizedCaseInsensitiveContains("learn") ||
           displayName.localizedCaseInsensitiveContains("playground")
  }

  /// Clears the current session.
  /// Should be called when the snack is closed or a new snack is opened.
  public func clearSession() {
    transportEventsTask?.cancel()
    transportEventsTask = nil
    firstFilesContinuation?.resume(throwing: CancellationError())
    firstFilesContinuation = nil
    if let transport {
      Task { await transport.disconnect() }
    }
    transport = nil
    mirroredFiles = nil
    hasBeenEdited = false
    connectionState = .disconnected
    channel = nil
    snackId = nil
    setupError = nil

    // Clear embedded session state
    isEmbeddedSession = false
    SnackDirectTransport.isEmbeddedSessionAvailable = false
    embeddedFiles = nil
    embeddedDependencies = [:]

    // Clear @Published properties - SwiftUI will batch these updates
    snackName = nil
    isReady = false
    isLesson = false
    lessonId = nil
    lessonDescription = nil

  }

  /// Checks if there's an active session for the given channel
  func hasActiveSession(forChannel channel: String) -> Bool {
    return self.channel == channel && isReady && (transport != nil || isEmbeddedSession)
  }

  // MARK: - Embedded Session Methods

  /// Builds a CODE message from the stored embedded files and dependencies.
  /// Returns nil if this isn't an embedded session or has no files.
  func buildCodeMessage() -> [String: Any]? {
    guard let files = embeddedFiles else { return nil }

    var allDiffs: [String: String] = [:]
    var s3urls: [String: String] = [:]

    for (path, file) in files {
      let isS3Url = file.contents.hasPrefix("https://snack-code-uploads.s3")

      if file.isAsset || isS3Url {
        allDiffs[path] = ""
        s3urls[path] = file.contents
      } else {
        allDiffs[path] = SnackDiff.generateUnifiedDiff(oldContents: "", newContents: file.contents)
      }
    }

    return [
      "type": "CODE",
      "diff": allDiffs,
      "s3url": s3urls,
      "dependencies": embeddedDependencies,
      "metadata": [:] as [String: Any]
    ]
  }

  /// Updates a file in an embedded session and broadcasts the change via direct transport.
  func updateEmbeddedFile(path: String, oldContents: String, newContents: String) {
    guard isEmbeddedSession, embeddedFiles != nil else { return }

    // Update the stored file
    embeddedFiles?[path] = SnackFile(path: path, contents: newContents, isAsset: false)

    // Build and send updated CODE message via direct transport
    if let codeMessage = buildCodeMessage() {
      SnackDirectTransport.shared?.sendCodeUpdate(codeMessage)
    }

    // Mark as edited and notify observers
    if !hasBeenEdited {
      hasBeenEdited = true
      NotificationCenter.default.post(name: Self.codeDidChangeNotification, object: nil)
    }
  }

  // MARK: - Private Methods

  /// Fetches snack code from the Snack API
  private func fetchSnackCode(snackId: String, isStaging: Bool) async throws -> (files: [String: SnackFile], dependencies: [String: [String: Any]], name: String?) {
    let snackResponse = try await SnackAPIClient.fetch(snackId: snackId, isStaging: isStaging)

    // Convert to SnackFile format
    var files: [String: SnackFile] = [:]
    for (path, file) in snackResponse.code {
      files[path] = SnackFile(
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

    return (files, dependencies, snackResponse.name)
  }
}

// MARK: - API Response Types

