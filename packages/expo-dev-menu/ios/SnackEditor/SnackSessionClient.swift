// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Client that connects to Snackpub to participate in a Snack session.
/// This allows the dev menu to receive and send code updates as a peer in the session.
public class SnackSessionClient {
  // MARK: - Types

  public struct SnackFile {
    public let path: String
    public let contents: String
    public let isAsset: Bool

    public init(path: String, contents: String, isAsset: Bool) {
      self.path = path
      self.contents = contents
      self.isAsset = isAsset
    }
  }

  enum ConnectionState {
    case disconnected
    case connecting
    case connected
  }

  // MARK: - Properties

  private let channel: String
  private let snackpubURL: String
  private var webSocketTask: URLSessionWebSocketTask?
  private var urlSession: URLSession?
  private var pingTimer: Timer?
  private var state: ConnectionState = .disconnected
  private var socketId: String?

  private var onFilesReceived: (([String: SnackFile]) -> Void)?
  private var onError: ((Error) -> Void)?
  public private(set) var currentFiles: [String: SnackFile] = [:]  // Track current file state
  private var currentDependencies: [String: Any] = [:]  // Track dependencies from last CODE message
  private var currentMetadata: [String: Any] = [:]  // Track metadata (includes SDK version)
  private var currentS3Urls: [String: String] = [:]  // Track ALL s3urls (assets + large files)

  // Host mode properties
  private var hostMode: Bool = false
  private var hostedFiles: [String: SnackFile]?
  private var onHostReady: (() -> Void)?

  /// Whether the code has been edited since session started
  public private(set) var hasBeenEdited: Bool = false

  // MARK: - Initialization

  init(channel: String, isStaging: Bool = false) {
    self.channel = channel
    self.snackpubURL = isStaging
      ? "wss://staging-snackpub.expo.dev/socket.io/?EIO=4&transport=websocket"
      : "wss://snackpub.expo.dev/socket.io/?EIO=4&transport=websocket"
  }

  /// Initialize in host mode with pre-fetched files.
  /// In host mode, the client responds to RESEND_CODE requests with the provided files.
  init(channel: String, isStaging: Bool = false, hostedFiles: [String: SnackFile], hostedDependencies: [String: Any] = [:]) {
    self.channel = channel
    self.snackpubURL = isStaging
      ? "wss://staging-snackpub.expo.dev/socket.io/?EIO=4&transport=websocket"
      : "wss://snackpub.expo.dev/socket.io/?EIO=4&transport=websocket"
    self.hostMode = true
    self.hostedFiles = hostedFiles
    self.currentFiles = hostedFiles
    self.currentDependencies = hostedDependencies
  }

  /// Resets currentFiles back to the original hostedFiles (discards edits)
  func resetToOriginalFiles() {
    if let hostedFiles = hostedFiles {
      currentFiles = hostedFiles
      hasBeenEdited = false
    }
  }

  /// Resets currentFiles to original and broadcasts the change to the runtime
  func resetAndBroadcast() {
    guard let hostedFiles = hostedFiles else { return }
    currentFiles = hostedFiles
    hasBeenEdited = false
    sendCodeMessage(files: hostedFiles)
    NotificationCenter.default.post(name: SnackEditingSession.codeDidChangeNotification, object: nil)
  }

  deinit {
    disconnect()
  }

  // MARK: - Public Methods

  /// Connects to Snackpub and requests the current code
  func connect(
    onFilesReceived: @escaping ([String: SnackFile]) -> Void,
    onError: @escaping (Error) -> Void
  ) {
    self.onFilesReceived = onFilesReceived
    self.onError = onError

    guard state == .disconnected else {
      return
    }

    state = .connecting

    guard let url = URL(string: snackpubURL) else {
      onError(SnackSessionError.invalidURL)
      return
    }

    urlSession = URLSession(configuration: .default)
    webSocketTask = urlSession?.webSocketTask(with: url)
    webSocketTask?.resume()

    receiveMessage()
  }

  /// Connects to Snackpub in host mode.
  /// In this mode, the client subscribes to the channel and responds to RESEND_CODE requests.
  func connectAsHost(
    onReady: @escaping () -> Void,
    onError: @escaping (Error) -> Void
  ) {
    guard hostMode else {
      onError(SnackSessionError.notInHostMode)
      return
    }

    self.onHostReady = onReady
    self.onError = onError

    guard state == .disconnected else {
      return
    }

    state = .connecting

    guard let url = URL(string: snackpubURL) else {
      onError(SnackSessionError.invalidURL)
      return
    }

    urlSession = URLSession(configuration: .default)
    webSocketTask = urlSession?.webSocketTask(with: url)
    webSocketTask?.resume()

    receiveMessage()
  }

  /// Disconnects from Snackpub
  func disconnect() {
    pingTimer?.invalidate()
    pingTimer = nil
    webSocketTask?.cancel(with: .goingAway, reason: nil)
    webSocketTask = nil
    urlSession?.invalidateAndCancel()
    urlSession = nil
    state = .disconnected
    socketId = nil
  }

  /// Sends a file update to the session
  /// - Parameters:
  ///   - path: The file path
  ///   - oldContents: The original file contents (for generating diff)
  ///   - newContents: The new file contents
  func sendFileUpdate(path: String, oldContents: String, newContents: String) {
    guard state == .connected else {
      return
    }

    // Generate unified diff in the format expected by the 'diff' npm package
    let diff = Self.generateUnifiedDiff(oldContents: oldContents, newContents: newContents)


    // Create CODE message with diffs for ALL files
    // Snack expects diff from empty string to full content for each file
    var allDiffs: [String: String] = [:]
    var s3urls: [String: String] = currentS3Urls

    for (filePath, file) in currentFiles {
      // Check if this is an asset or S3-hosted file
      let isS3File = file.isAsset || file.contents.hasPrefix("https://snack-code-uploads.s3")

      if isS3File {
        // For assets/S3 files, use empty diff and put URL in s3urls
        allDiffs[filePath] = ""
        s3urls[filePath] = file.contents
      } else if filePath == path {
        // Use the new content diff for the changed file
        allDiffs[filePath] = diff
      } else {
        // For unchanged code files, generate diff from empty to current content
        allDiffs[filePath] = Self.generateUnifiedDiff(oldContents: "", newContents: file.contents)
      }
    }

    // Add empty diffs for any s3url entries not in currentFiles (assets received from website)
    // This prevents the runtime from deleting these files
    for s3path in s3urls.keys {
      if allDiffs[s3path] == nil {
        allDiffs[s3path] = ""
      }
    }

    let codeMessage: [String: Any] = [
      "type": "CODE",
      "diff": allDiffs,
      "s3url": s3urls,
      "dependencies": currentDependencies,
      "metadata": currentMetadata
    ]


    sendSocketIOEvent("message", data: [
      "channel": channel,
      "message": codeMessage,
      "sender": socketId ?? ""
    ])

    // Update local cache
    currentFiles[path] = SnackFile(path: path, contents: newContents, isAsset: false)

    // Mark as edited and notify observers
    if !hasBeenEdited {
      hasBeenEdited = true
      NotificationCenter.default.post(name: SnackEditingSession.codeDidChangeNotification, object: nil)
    }
  }

  /// Generates a unified diff in the format used by the 'diff' npm package
  /// Since we're doing a full replacement, we generate a diff that adds all new lines
  /// This is applied to empty string on the receiving end (no s3url = apply to "")
  static func generateUnifiedDiff(oldContents: String, newContents: String) -> String {
    if newContents.isEmpty {
      return ""
    }

    // Split content into lines, preserving knowledge of trailing newline
    let hasTrailingNewline = newContents.hasSuffix("\n")
    var newLines = newContents.components(separatedBy: "\n")

    // Remove empty last element if content ends with newline
    if hasTrailingNewline && newLines.last == "" {
      newLines.removeLast()
    }

    let newCount = newLines.count

    // Format matching the 'diff' npm package's createPatch output exactly
    // Note: tabs after "--- code" and "+++ code", and -1,0 not -0,0
    var diff = "Index: code\n"
    diff += "===================================================================\n"
    diff += "--- code\t\n"
    diff += "+++ code\t\n"

    // Hunk header: @@ -1,0 +1,newCount @@ (diff package uses -1,0 for empty old file)
    diff += "@@ -1,0 +1,\(newCount) @@\n"

    // Add all new lines
    for line in newLines {
      diff += "+\(line)\n"
    }

    // Add "no newline" marker if content doesn't end with newline
    if !hasTrailingNewline {
      diff += "\\ No newline at end of file\n"
    }

    return diff
  }

  // MARK: - Private Methods

  private func receiveMessage() {
    webSocketTask?.receive { [weak self] result in
      switch result {
      case .success(let message):
        self?.handleWebSocketMessage(message)
        self?.receiveMessage() // Continue receiving
      case .failure(let error):
        self?.onError?(error)
        self?.state = .disconnected
      }
    }
  }

  private func handleWebSocketMessage(_ message: URLSessionWebSocketTask.Message) {
    guard case .string(let text) = message else { return }

    // Engine.IO packet types:
    // 0 = OPEN, 1 = CLOSE, 2 = PING, 3 = PONG, 4 = MESSAGE
    guard let firstChar = text.first else { return }

    switch firstChar {
    case "0": // Engine.IO OPEN
      handleEngineIOOpen(text)

    case "2": // Engine.IO PING
      sendRaw("3") // PONG

    case "4": // Engine.IO MESSAGE (Socket.IO packet inside)
      handleSocketIOPacket(String(text.dropFirst()))

    default:
      break
    }
  }

  private func handleEngineIOOpen(_ text: String) {
    // Parse the open packet to get ping interval
    // Format: 0{"sid":"xxx","upgrades":[],"pingInterval":25000,"pingTimeout":20000}

    // Send Socket.IO CONNECT packet (40 = message + connect)
    sendRaw("40")
  }

  private func handleSocketIOPacket(_ text: String) {
    guard let firstChar = text.first else { return }

    switch firstChar {
    case "0": // Socket.IO CONNECT ACK
      handleSocketIOConnect(String(text.dropFirst()))

    case "2": // Socket.IO EVENT
      handleSocketIOEvent(String(text.dropFirst()))

    default:
      break
    }
  }

  private func handleSocketIOConnect(_ text: String) {
    // Parse: {"sid":"xxx"}
    if let data = text.data(using: .utf8),
       let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
       let sid = json["sid"] as? String {
      socketId = sid
    }

    state = .connected

    // Subscribe to channel
    subscribeToChannel()

    // Start ping timer
    startPingTimer()
  }

  private func handleSocketIOEvent(_ text: String) {
    // Format: ["eventName", data]
    guard let data = text.data(using: .utf8),
          let array = try? JSONSerialization.jsonObject(with: data) as? [Any],
          let eventName = array.first as? String else {
      return
    }

    let eventData = array.count > 1 ? array[1] : nil

    switch eventName {
    case "message":
      handleMessage(eventData)

    case "joinChannel", "leaveChannel":
      break

    default:
      break
    }
  }

  private func handleMessage(_ data: Any?) {
    guard let dict = data as? [String: Any],
          let message = dict["message"] as? [String: Any],
          let type = message["type"] as? String else {
      return
    }

    switch type {
    case "CODE":
      handleCodeMessage(message)

    case "RESEND_CODE":
      if hostMode {
        handleResendCodeRequest()
      }

    default:
      break
    }
  }

  /// Responds to a RESEND_CODE request by sending the hosted files
  private func handleResendCodeRequest() {
    guard let files = hostedFiles else { return }
    sendCodeMessage(files: files)
  }

  /// Sends a CODE message with the given files
  private func sendCodeMessage(files: [String: SnackFile]) {
    guard state == .connected else { return }

    // Generate diffs for all files (from empty string to full content)
    var allDiffs: [String: String] = [:]
    var s3urls: [String: String] = [:]

    for (path, file) in files {
      // Check if contents is an S3 URL (for uploaded files)
      let isS3Url = file.contents.hasPrefix("https://snack-code-uploads.s3")

      if file.isAsset || isS3Url {
        // For assets and uploaded code files, include empty diff and the s3url
        allDiffs[path] = ""
        s3urls[path] = file.contents
      } else {
        // For inline code files, generate diff from empty to full content
        allDiffs[path] = Self.generateUnifiedDiff(oldContents: "", newContents: file.contents)
      }
    }

    let codeMessage: [String: Any] = [
      "type": "CODE",
      "diff": allDiffs,
      "s3url": s3urls,
      "dependencies": currentDependencies,
      "metadata": currentMetadata
    ]

    sendSocketIOEvent("message", data: [
      "channel": channel,
      "message": codeMessage,
      "sender": socketId ?? ""
    ])
  }

  private func handleCodeMessage(_ message: [String: Any]) {
    guard let diff = message["diff"] as? [String: String] else {
      return
    }

    let s3url = message["s3url"] as? [String: String] ?? [:]

    // Save dependencies and metadata for later use when sending updates
    if let dependencies = message["dependencies"] as? [String: Any] {
      self.currentDependencies = dependencies
    }
    if let metadata = message["metadata"] as? [String: Any] {
      self.currentMetadata = metadata
    }

    // Save ALL s3urls for later use when sending updates (includes assets + large files)
    self.currentS3Urls = s3url

    // Convert diffs to files
    // Note: diff format is a unified diff, we need to apply it
    // For simplicity, if there's no s3url, the diff IS the content (for new files)
    var files: [String: SnackFile] = [:]

    for (path, diffContent) in diff {
      // Check if this is an asset
      let isAsset = s3url[path]?.contains("~asset") == true ||
                    s3url[path]?.contains("%7Easset") == true

      if isAsset {
        // Skip assets - they're tracked separately in currentAssetUrls
        continue
      }

      // For code files, we need to reconstruct content from diff
      // If s3url exists, fetch base content and apply diff
      // If no s3url, the diff is applied to empty string
      let contents = applyDiff(diffContent, to: "")

      files[path] = SnackFile(path: path, contents: contents, isAsset: false)
    }

    // Fetch any files that have s3url (large files)
    Task {
      let allFiles = await self.fetchS3Files(s3url: s3url, diff: diff, existingFiles: files)

      // Merge with current files (updates override existing)
      for (path, file) in allFiles {
        self.currentFiles[path] = file
      }

      // Remove deleted files (files in currentFiles but not in diff or s3url)
      let currentPaths = Set(diff.keys).union(Set(s3url.keys))
      for path in self.currentFiles.keys {
        if !currentPaths.contains(path) {
          self.currentFiles.removeValue(forKey: path)
        }
      }

      await MainActor.run {
        self.onFilesReceived?(self.currentFiles)
      }
    }
  }

  /// Apply a unified diff to base content
  /// Uses the standard unified diff format from the 'diff' npm package
  private func applyDiff(_ patch: String, to base: String) -> String {
    // If patch is empty, return base as-is
    if patch.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
      return base
    }

    // Parse the unified diff format
    let patchLines = patch.components(separatedBy: "\n")
    let baseLines = base.components(separatedBy: "\n")
    var result: [String] = []

    // Track current position in base and patch
    var patchIndex = 0

    // Skip diff header lines (--- and +++)
    while patchIndex < patchLines.count {
      let line = patchLines[patchIndex]
      if line.hasPrefix("@@") {
        break
      }
      patchIndex += 1
    }

    // For empty base (new file), extract all added lines
    if base.isEmpty {
      var addedLines: [String] = []
      for i in patchIndex..<patchLines.count {
        let line = patchLines[i]
        if line.hasPrefix("+") && !line.hasPrefix("+++") {
          addedLines.append(String(line.dropFirst()))
        } else if line.hasPrefix("@@") || line.hasPrefix("-") || line.hasPrefix("\\") {
          // Skip hunk headers, removed lines, and "no newline" markers
          continue
        } else if !line.isEmpty {
          // Context line (shouldn't exist for empty base, but handle it)
          addedLines.append(line)
        }
      }

      // If we got no results, the patch might just be raw content
      if addedLines.isEmpty && !patch.isEmpty {
        return patch
      }

      // Remove trailing newline that diff package adds
      let joined = addedLines.joined(separator: "\n")
      if joined.hasPrefix("\n") {
        return String(joined.dropFirst())
      }
      return joined
    }

    // For non-empty base, apply hunks
    var baseLineIndex = 0

    while patchIndex < patchLines.count {
      let line = patchLines[patchIndex]

      if line.hasPrefix("@@") {
        // Parse hunk header: @@ -start,count +start,count @@
        // Format: @@ -oldStart,oldCount +newStart,newCount @@
        let regex = try? NSRegularExpression(pattern: "@@ -(\\d+)(?:,(\\d+))? \\+(\\d+)(?:,(\\d+))? @@")
        if let match = regex?.firstMatch(in: line, range: NSRange(line.startIndex..., in: line)) {
          let oldStartRange = Range(match.range(at: 1), in: line)!
          let oldStart = Int(line[oldStartRange])! - 1 // 0-indexed

          // Copy any lines before this hunk
          while baseLineIndex < oldStart && baseLineIndex < baseLines.count {
            result.append(baseLines[baseLineIndex])
            baseLineIndex += 1
          }
        }
        patchIndex += 1
        continue
      }

      if line.hasPrefix("-") && !line.hasPrefix("---") {
        // Removed line - skip it in base
        baseLineIndex += 1
        patchIndex += 1
      } else if line.hasPrefix("+") && !line.hasPrefix("+++") {
        // Added line - add to result
        result.append(String(line.dropFirst()))
        patchIndex += 1
      } else if line.hasPrefix("\\") {
        // "\ No newline at end of file" - skip
        patchIndex += 1
      } else if line.hasPrefix(" ") || (!line.hasPrefix("-") && !line.hasPrefix("+") && !line.hasPrefix("@")) {
        // Context line - copy from base
        if baseLineIndex < baseLines.count {
          result.append(baseLines[baseLineIndex])
          baseLineIndex += 1
        }
        patchIndex += 1
      } else {
        patchIndex += 1
      }
    }

    // Copy remaining lines from base
    while baseLineIndex < baseLines.count {
      result.append(baseLines[baseLineIndex])
      baseLineIndex += 1
    }

    return result.joined(separator: "\n")
  }

  private func fetchS3Files(s3url: [String: String], diff: [String: String], existingFiles: [String: SnackFile]) async -> [String: SnackFile] {
    var files = existingFiles

    for (path, url) in s3url {
      // Skip assets
      if url.contains("~asset") || url.contains("%7Easset") {
        continue
      }

      do {
        let (data, _) = try await URLSession.shared.data(from: URL(string: url)!)

        if let contents = String(data: data, encoding: .utf8) {
          var finalContents = contents
          // Apply diff if there is one for this file
          if let fileDiff = diff[path], !fileDiff.isEmpty {
            finalContents = applyDiff(fileDiff, to: contents)
          }
          files[path] = SnackFile(path: path, contents: finalContents, isAsset: false)
        }
      } catch {
        // Silently skip files that fail to fetch
      }
    }

    return files
  }

  private func subscribeToChannel() {
    sendSocketIOEvent("subscribeChannel", data: [
      "channel": channel,
      "sender": socketId ?? ""
    ])

    if hostMode {
      // In host mode, we're ready to respond to RESEND_CODE requests
      onHostReady?()
    } else {
      // In client mode, request current code
      requestCode()
    }
  }

  private func requestCode() {
    sendSocketIOEvent("message", data: [
      "channel": channel,
      "message": [
        "type": "RESEND_CODE",
        "device": [
          "id": "dev-menu-\(UUID().uuidString.prefix(8))",
          "name": "Dev Menu",
          "platform": "ios"
        ]
      ],
      "sender": socketId ?? ""
    ])
  }

  private func sendSocketIOEvent(_ event: String, data: Any) {
    guard let jsonData = try? JSONSerialization.data(withJSONObject: [event, data]),
          let jsonString = String(data: jsonData, encoding: .utf8) else {
      return
    }

    // Socket.IO EVENT packet: 42["event", data]
    sendRaw("42\(jsonString)")
  }

  private func sendRaw(_ text: String) {
    webSocketTask?.send(.string(text)) { _ in }
  }

  private func startPingTimer() {
    pingTimer?.invalidate()
    pingTimer = Timer.scheduledTimer(withTimeInterval: 25.0, repeats: true) { [weak self] _ in
      self?.sendRaw("2") // Engine.IO PING
    }
  }
}

// MARK: - Errors

enum SnackSessionError: Error, LocalizedError {
  case invalidURL
  case connectionFailed
  case timeout
  case notInHostMode

  var errorDescription: String? {
    switch self {
    case .invalidURL: return "Invalid Snackpub URL"
    case .connectionFailed: return "Failed to connect to Snackpub"
    case .timeout: return "Connection timed out"
    case .notInHostMode: return "Cannot connect as host when not in host mode"
    }
  }
}
