// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum SnackpubError: Error, LocalizedError {
  case timeout
  case connectionFailed

  var errorDescription: String? {
    switch self {
    case .timeout:
      return "Timed out connecting to the Snack session server, so live editing is unavailable. Check your network connection and reopen the Snack to retry."
    case .connectionFailed:
      return "Could not connect to the Snack session server, so live editing is unavailable. Check your network connection and reopen the Snack to retry."
    }
  }
}

/// Actor-owned Snackpub connection: one per channel, all state isolated here.
/// Handles the handshake with a timeout, server pings, CODE/RESEND_CODE
/// messages, reconnecting with backoff, and queuing edits made while offline.
actor SnackpubTransport {
  enum Mode {
    case viewer
    case host(files: [String: SnackFile], dependencies: [String: Any])
  }

  enum ConnectionState: Equatable {
    case disconnected, connecting, connected, reconnecting
  }

  enum Event {
    case filesUpdated([String: SnackFile])
    case stateChanged(ConnectionState)
    case edited
  }

  nonisolated let events: AsyncStream<Event>
  private let eventContinuation: AsyncStream<Event>.Continuation

  private let channel: String
  private let url: URL
  private let mode: Mode
  private let socketFactory: (URL) -> any WebSocketConnecting
  private let connectTimeout: TimeInterval
  private let reconnectBaseDelay: TimeInterval

  private var socket: (any WebSocketConnecting)?
  private var receiveTask: Task<Void, Never>?
  private var reconnectTask: Task<Void, Never>?
  private var state: ConnectionState = .disconnected
  private var socketId: String?
  private var isDeliberatelyClosed = false
  private var needsFlushAfterReconnect = false

  private var files: [String: SnackFile] = [:]
  private var dependencies: [String: Any] = [:]
  private var metadata: [String: Any] = [:]
  private var s3Urls: [String: String] = [:]
  private var edited = false

  private var isHostMode: Bool {
    if case .host = mode { return true }
    return false
  }

  init(
    channel: String,
    isStaging: Bool,
    mode: Mode,
    socketFactory: @escaping (URL) -> any WebSocketConnecting = { URLSessionWebSocket(url: $0) },
    connectTimeout: TimeInterval = 10,
    reconnectBaseDelay: TimeInterval = 1.0
  ) {
    self.channel = channel
    self.url = URL(string: isStaging
      ? "wss://staging-snackpub.expo.dev/socket.io/?EIO=4&transport=websocket"
      : "wss://snackpub.expo.dev/socket.io/?EIO=4&transport=websocket")!
    self.mode = mode
    self.socketFactory = socketFactory
    self.connectTimeout = connectTimeout
    self.reconnectBaseDelay = reconnectBaseDelay
    (events, eventContinuation) = AsyncStream.makeStream()
    if case .host(let files, let dependencies) = mode {
      self.files = files
      self.dependencies = dependencies
    }
  }

  // MARK: - Public API

  func connect() async throws {
    guard state == .disconnected else { return }
    try await establishConnection()
  }

  func disconnect() {
    isDeliberatelyClosed = true
    reconnectTask?.cancel()
    receiveTask?.cancel()
    socket?.close()
    socket = nil
    setState(.disconnected)
    eventContinuation.finish()
  }

  func currentFiles() -> [String: SnackFile] {
    files
  }

  func hasBeenEdited() -> Bool {
    edited
  }

  /// Applies the edit locally and sends it to the channel. If the connection
  /// is down, the edit is kept and flushed after the next successful
  /// reconnect - never silently dropped.
  func sendFileUpdate(path: String, oldContents: String, newContents: String) async {
    files[path] = SnackFile(path: path, contents: newContents, isAsset: false)
    if !edited {
      edited = true
      eventContinuation.yield(.edited)
    }

    guard state == .connected else {
      needsFlushAfterReconnect = true
      return
    }

    await sendFullCode(
      changedPath: path,
      changedDiff: SnackDiff.generateUnifiedDiff(oldContents: oldContents, newContents: newContents)
    )
  }

  // MARK: - Connection lifecycle

  private func establishConnection() async throws {
    setState(state == .reconnecting ? .reconnecting : .connecting)
    let socket = socketFactory(url)
    self.socket = socket
    socket.connect()

    do {
      try await withThrowingTaskGroup(of: Void.self) { group in
        group.addTask { try await self.runHandshake(on: socket) }
        group.addTask {
          try await Task.sleep(nanoseconds: UInt64(self.connectTimeout * 1_000_000_000))
          throw SnackpubError.timeout
        }
        try await group.next()
        group.cancelAll()
      }
    } catch {
      socket.close()
      self.socket = nil
      setState(.disconnected)
      throw error
    }

    startReceiveLoop(on: socket)
    setState(.connected)

    if needsFlushAfterReconnect {
      needsFlushAfterReconnect = false
      await sendFullCode(changedPath: nil, changedDiff: nil)
    }
  }

  /// Consumes handshake frames until the channel is subscribed.
  private func runHandshake(on socket: any WebSocketConnecting) async throws {
    for try await text in socket.messages {
      switch SnackpubFrame.parse(text) {
      case .open:
        try await socket.send(SnackpubFrame.connectPacket)
      case .connectAck(let sid):
        socketId = sid
        try await sendEvent("subscribeChannel", data: ["channel": channel, "sender": sid ?? ""], on: socket)
        if case .viewer = mode {
          try await sendEvent("message", data: [
            "channel": channel,
            "message": [
              "type": "RESEND_CODE",
              "device": [
                "id": "dev-menu-\(UUID().uuidString.prefix(8))",
                "name": "Dev Menu",
                "platform": "ios"
              ]
            ],
            "sender": sid ?? ""
          ], on: socket)
        }
        return
      case .ping:
        try await socket.send(SnackpubFrame.pongPacket)
      default:
        continue
      }
    }
    throw SnackpubError.connectionFailed
  }

  private func startReceiveLoop(on socket: any WebSocketConnecting) {
    receiveTask = Task {
      do {
        for try await text in socket.messages {
          await self.handleFrame(text)
        }
      } catch {
        await self.handleStreamFailure()
      }
    }
  }

  private func handleStreamFailure() {
    guard !isDeliberatelyClosed else { return }
    socket?.close()
    socket = nil
    setState(.reconnecting)

    reconnectTask = Task {
      var attempt = 0
      while !Task.isCancelled {
        let delay = min(30, reconnectBaseDelay * pow(2, Double(attempt)))
        try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
        if Task.isCancelled { return }
        do {
          try await self.reconnectOnce()
          return
        } catch {
          attempt += 1
        }
      }
    }
  }

  private func reconnectOnce() async throws {
    // Hosts must resync peers after reconnecting. Viewers only flush when
    // they have queued local edits (flag already set by sendFileUpdate).
    if isHostMode {
      needsFlushAfterReconnect = true
    }
    setState(.reconnecting)
    try await establishConnection()
  }

  // MARK: - Incoming frames

  private func handleFrame(_ text: String) async {
    switch SnackpubFrame.parse(text) {
    case .ping:
      try? await socket?.send(SnackpubFrame.pongPacket)
    case .event(let name, let payload):
      guard name == "message" else { return }
      await handleChannelMessage(payload)
    default:
      break
    }
  }

  private func handleChannelMessage(_ payload: Any?) async {
    guard let dict = payload as? [String: Any],
          let message = dict["message"] as? [String: Any],
          let type = message["type"] as? String else {
      return
    }

    switch type {
    case "CODE":
      await handleCodeMessage(message)
    case "RESEND_CODE":
      if isHostMode {
        // Reply with current files (including local edits), not the
        // originally hosted ones - late-joining peers must see edits.
        await sendFullCode(changedPath: nil, changedDiff: nil)
      }
    default:
      break
    }
  }

  private func handleCodeMessage(_ message: [String: Any]) async {
    guard let diff = message["diff"] as? [String: String] else {
      return
    }

    let s3url = message["s3url"] as? [String: String] ?? [:]

    if let deps = message["dependencies"] as? [String: Any] {
      dependencies = deps
    }
    if let meta = message["metadata"] as? [String: Any] {
      metadata = meta
    }
    s3Urls = s3url

    // Convert diffs to files. Diffs without an s3url base apply to "".
    var incoming: [String: SnackFile] = [:]
    for (path, diffContent) in diff {
      let isAsset = s3url[path]?.contains("~asset") == true ||
                    s3url[path]?.contains("%7Easset") == true
      if isAsset {
        continue
      }
      incoming[path] = SnackFile(path: path, contents: SnackDiff.apply(diffContent, to: ""), isAsset: false)
    }

    let allFiles = await fetchS3Files(s3url: s3url, diff: diff, existingFiles: incoming)

    for (path, file) in allFiles {
      files[path] = file
    }

    // Remove files absent from this CODE message (deletions).
    let currentPaths = Set(diff.keys).union(s3url.keys)
    for path in files.keys where !currentPaths.contains(path) {
      files.removeValue(forKey: path)
    }

    eventContinuation.yield(.filesUpdated(files))
  }

  private func fetchS3Files(
    s3url: [String: String],
    diff: [String: String],
    existingFiles: [String: SnackFile]
  ) async -> [String: SnackFile] {
    var result = existingFiles

    for (path, urlString) in s3url {
      if urlString.contains("~asset") || urlString.contains("%7Easset") {
        continue
      }
      guard let fileURL = URL(string: urlString) else {
        continue
      }

      do {
        let (data, _) = try await URLSession.shared.data(from: fileURL)
        if let contents = String(data: data, encoding: .utf8) {
          var finalContents = contents
          if let fileDiff = diff[path], !fileDiff.isEmpty {
            finalContents = SnackDiff.apply(fileDiff, to: contents)
          }
          result[path] = SnackFile(path: path, contents: finalContents, isAsset: false)
        }
      } catch {
        // Skip files that fail to fetch; the rest of the CODE message still applies
      }
    }

    return result
  }

  // MARK: - Outgoing messages

  /// Sends a CODE message covering every file. When `changedPath` is set, its
  /// precomputed diff is used; all other code files are diffed from empty
  /// (the full-replacement protocol the snack runtime expects).
  private func sendFullCode(changedPath: String?, changedDiff: String?) async {
    guard let socket else { return }

    var allDiffs: [String: String] = [:]
    var s3urls: [String: String] = s3Urls

    for (filePath, file) in files {
      let isS3File = file.isAsset || file.contents.hasPrefix("https://snack-code-uploads.s3")

      if isS3File {
        allDiffs[filePath] = ""
        s3urls[filePath] = file.contents
      } else if filePath == changedPath, let changedDiff {
        allDiffs[filePath] = changedDiff
      } else {
        allDiffs[filePath] = SnackDiff.generateUnifiedDiff(oldContents: "", newContents: file.contents)
      }
    }

    // Keep s3url-only entries alive so the runtime doesn't delete them.
    for s3path in s3urls.keys where allDiffs[s3path] == nil {
      allDiffs[s3path] = ""
    }

    let codeMessage: [String: Any] = [
      "type": "CODE",
      "diff": allDiffs,
      "s3url": s3urls,
      "dependencies": dependencies,
      "metadata": metadata
    ]

    try? await sendEvent("message", data: [
      "channel": channel,
      "message": codeMessage,
      "sender": socketId ?? ""
    ], on: socket)
  }

  private func sendEvent(_ name: String, data: Any, on socket: any WebSocketConnecting) async throws {
    guard let packet = SnackpubFrame.eventPacket(name, data: data) else {
      return
    }
    try await socket.send(packet)
  }

  private func setState(_ newState: ConnectionState) {
    guard state != newState else { return }
    state = newState
    eventContinuation.yield(.stateChanged(newState))
  }
}
