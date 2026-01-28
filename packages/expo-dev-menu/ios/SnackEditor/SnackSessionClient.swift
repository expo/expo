// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Client that connects to Snackpub to participate in a Snack session.
/// This allows the dev menu to receive and send code updates as a peer in the session.
class SnackSessionClient {
  // MARK: - Types

  struct SnackFile {
    let path: String
    let contents: String
    let isAsset: Bool
  }

  struct CodeMessage {
    let diff: [String: String]
    let s3url: [String: String]
    let dependencies: [String: Any]
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
  private var currentFiles: [String: SnackFile] = [:]  // Track current file state
  private var currentDependencies: [String: Any] = [:]  // Track dependencies from last CODE message
  private var currentMetadata: [String: Any] = [:]  // Track metadata (includes SDK version)
  private var currentS3Urls: [String: String] = [:]  // Track ALL s3urls (assets + large files)

  // MARK: - Initialization

  init(channel: String, isStaging: Bool = false) {
    self.channel = channel
    self.snackpubURL = isStaging
      ? "wss://staging-snackpub.expo.dev/socket.io/?EIO=4&transport=websocket"
      : "wss://snackpub.expo.dev/socket.io/?EIO=4&transport=websocket"
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
      print("[SnackSessionClient] Already connecting or connected")
      return
    }

    state = .connecting
    print("[SnackSessionClient] Connecting to channel: \(channel)")

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
    print("[SnackSessionClient] Disconnected")
  }

  /// Sends a file update to the session
  /// - Parameters:
  ///   - path: The file path
  ///   - oldContents: The original file contents (for generating diff)
  ///   - newContents: The new file contents
  func sendFileUpdate(path: String, oldContents: String, newContents: String) {
    guard state == .connected else {
      print("[SnackSessionClient] Cannot send update - not connected")
      return
    }

    // Generate unified diff in the format expected by the 'diff' npm package
    let diff = generateUnifiedDiff(oldContents: oldContents, newContents: newContents)

    print("[SnackSessionClient] Sending file update for: \(path)")
    print("[SnackSessionClient]   diff length: \(diff.count) chars")

    // Create CODE message with diffs for ALL files
    // Snack expects diff from empty string to full content for each file
    var allDiffs: [String: String] = [:]
    for (filePath, file) in currentFiles {
      if filePath == path {
        // Use the new content diff for the changed file
        allDiffs[filePath] = diff
      } else {
        // For unchanged files, generate diff from empty to current content
        allDiffs[filePath] = generateUnifiedDiff(oldContents: "", newContents: file.contents)
      }
    }

    // Include empty diffs for s3url entries (assets + large files)
    for s3path in currentS3Urls.keys {
      allDiffs[s3path] = ""
    }

    let codeMessage: [String: Any] = [
      "type": "CODE",
      "diff": allDiffs,
      "s3url": currentS3Urls,
      "dependencies": currentDependencies,
      "metadata": currentMetadata
    ]

    print("[SnackSessionClient] Sending CODE with \(currentDependencies.count) deps, \(currentS3Urls.count) s3urls, SDK: \(currentMetadata["expoSDKVersion"] ?? "none")")

    sendSocketIOEvent("message", data: [
      "channel": channel,
      "message": codeMessage,
      "sender": socketId ?? ""
    ])

    // Update local cache
    currentFiles[path] = SnackFile(path: path, contents: newContents, isAsset: false)
  }

  /// Generates a unified diff in the format used by the 'diff' npm package
  /// Since we're doing a full replacement, we generate a diff that adds all new lines
  /// This is applied to empty string on the receiving end (no s3url = apply to "")
  private func generateUnifiedDiff(oldContents: String, newContents: String) -> String {
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

    // Log the diff for debugging (first 10 lines)
    let diffLines = diff.components(separatedBy: "\n")
    print("[SnackSessionClient] Generated diff (\(diffLines.count) lines):")
    for (i, line) in diffLines.prefix(10).enumerated() {
      print("[SnackSessionClient]   \(i): \(line)")
    }
    if diffLines.count > 10 {
      print("[SnackSessionClient]   ... (\(diffLines.count - 10) more lines)")
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
        print("[SnackSessionClient] WebSocket error: \(error)")
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
      print("[SnackSessionClient] Unknown packet: \(text.prefix(50))")
    }
  }

  private func handleEngineIOOpen(_ text: String) {
    // Parse the open packet to get ping interval
    // Format: 0{"sid":"xxx","upgrades":[],"pingInterval":25000,"pingTimeout":20000}
    print("[SnackSessionClient] Engine.IO connected")

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
      print("[SnackSessionClient] Unknown Socket.IO packet type: \(firstChar)")
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
    print("[SnackSessionClient] Socket.IO connected, sid: \(socketId ?? "unknown")")

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

    case "joinChannel":
      print("[SnackSessionClient] Someone joined the channel")

    case "leaveChannel":
      print("[SnackSessionClient] Someone left the channel")

    default:
      print("[SnackSessionClient] Unknown event: \(eventName)")
    }
  }

  private func handleMessage(_ data: Any?) {
    guard let dict = data as? [String: Any],
          let message = dict["message"] as? [String: Any],
          let type = message["type"] as? String else {
      return
    }

    print("[SnackSessionClient] Received message type: \(type)")

    if type == "CODE" {
      handleCodeMessage(message)
    }
  }

  private func handleCodeMessage(_ message: [String: Any]) {
    // Log all top-level keys in the CODE message
    print("[SnackSessionClient] CODE message keys: \(message.keys.sorted())")

    guard let diff = message["diff"] as? [String: String] else {
      print("[SnackSessionClient] CODE message missing diff or wrong type")
      if let diffValue = message["diff"] {
        print("[SnackSessionClient]   diff type: \(type(of: diffValue))")
      }
      return
    }

    let s3url = message["s3url"] as? [String: String] ?? [:]

    // Save dependencies and metadata for later use when sending updates
    if let dependencies = message["dependencies"] as? [String: Any] {
      self.currentDependencies = dependencies
      print("[SnackSessionClient] Saved \(dependencies.count) dependencies")
    }
    if let metadata = message["metadata"] as? [String: Any] {
      self.currentMetadata = metadata
      if let sdkVersion = metadata["expoSDKVersion"] as? String {
        print("[SnackSessionClient] Saved metadata with SDK version: \(sdkVersion)")
      }
    }

    print("[SnackSessionClient] Received CODE:")
    print("[SnackSessionClient]   diff keys (\(diff.count)): \(diff.keys.sorted())")
    print("[SnackSessionClient]   s3url keys (\(s3url.count)): \(s3url.keys.sorted())")

    // Log first 100 chars of each diff to understand format
    for (path, content) in diff {
      let preview = String(content.prefix(100)).replacingOccurrences(of: "\n", with: "\\n")
      print("[SnackSessionClient]   diff[\(path)]: \(preview)...")
    }

    // Save ALL s3urls for later use when sending updates (includes assets + large files)
    self.currentS3Urls = s3url
    if !self.currentS3Urls.isEmpty {
      let assetCount = s3url.values.filter { $0.contains("~asset") || $0.contains("%7Easset") }.count
      print("[SnackSessionClient] Saved \(self.currentS3Urls.count) s3urls (\(assetCount) assets)")
    }

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

      print("[SnackSessionClient] Total files after processing: \(self.currentFiles.count)")
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
        print("[SnackSessionClient] Skipping asset: \(path)")
        continue
      }

      print("[SnackSessionClient] Fetching S3 file: \(path)")

      do {
        let (data, response) = try await URLSession.shared.data(from: URL(string: url)!)
        let httpResponse = response as? HTTPURLResponse
        print("[SnackSessionClient]   HTTP status: \(httpResponse?.statusCode ?? -1), size: \(data.count) bytes")

        if let contents = String(data: data, encoding: .utf8) {
          var finalContents = contents
          // Apply diff if there is one for this file
          if let fileDiff = diff[path], !fileDiff.isEmpty {
            print("[SnackSessionClient]   Applying diff to S3 content for \(path)")
            finalContents = applyDiff(fileDiff, to: contents)
          }
          files[path] = SnackFile(path: path, contents: finalContents, isAsset: false)
          print("[SnackSessionClient]   Loaded \(path): \(finalContents.count) chars")
        } else {
          print("[SnackSessionClient]   Failed to decode \(path) as UTF-8 (binary file?)")
        }
      } catch {
        print("[SnackSessionClient] Failed to fetch \(path): \(error)")
      }
    }

    return files
  }

  private func subscribeToChannel() {
    sendSocketIOEvent("subscribeChannel", data: [
      "channel": channel,
      "sender": socketId ?? ""
    ])

    // Request current code
    requestCode()
  }

  private func requestCode() {
    print("[SnackSessionClient] Requesting code...")
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
    webSocketTask?.send(.string(text)) { error in
      if let error = error {
        print("[SnackSessionClient] Send error: \(error)")
      }
    }
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

  var errorDescription: String? {
    switch self {
    case .invalidURL: return "Invalid Snackpub URL"
    case .connectionFailed: return "Failed to connect to Snackpub"
    case .timeout: return "Connection timed out"
    }
  }
}
