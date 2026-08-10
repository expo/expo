// Copyright 2015-present 650 Industries. All rights reserved.

import XCTest
@testable import Expo_Go

final class SnackpubTransportTests: XCTestCase {
  private func makeHostTransport(
    socket: FakeWebSocket,
    files: [String: SnackFile] = ["App.js": SnackFile(path: "App.js", contents: "x\n", isAsset: false)]
  ) -> SnackpubTransport {
    SnackpubTransport(
      channel: "c1",
      isStaging: false,
      mode: .host(files: files, dependencies: [:]),
      socketFactory: { _ in socket }
    )
  }

  /// Primes the fake so the standard handshake completes: OPEN is buffered,
  /// and the transport's "40" connect packet is answered with a connect ack.
  private func completeHandshake(_ socket: FakeWebSocket) {
    socket.onSend = { text in
      if text == SnackpubFrame.connectPacket {
        socket.receive(#"40{"sid":"s1"}"#)
      }
    }
    socket.receive(#"0{"sid":"e1","pingInterval":25000}"#)
  }

  // MARK: - Handshake

  func testHandshakeSubscribesChannel() async throws {
    let socket = FakeWebSocket()
    let transport = makeHostTransport(socket: socket)
    completeHandshake(socket)
    try await transport.connect()
    XCTAssertTrue(socket.sent.contains { $0.contains("subscribeChannel") && $0.contains("c1") })
  }

  func testViewerRequestsCodeAfterSubscribe() async throws {
    let socket = FakeWebSocket()
    let transport = SnackpubTransport(channel: "c1", isStaging: false, mode: .viewer, socketFactory: { _ in socket })
    completeHandshake(socket)
    try await transport.connect()
    XCTAssertTrue(socket.sent.contains { $0.contains("RESEND_CODE") })
  }

  func testConnectTimesOutWhenHandshakeStalls() async {
    let socket = FakeWebSocket()
    let transport = SnackpubTransport(
      channel: "c1", isStaging: false, mode: .viewer,
      socketFactory: { _ in socket }, connectTimeout: 0.2
    )
    do {
      try await transport.connect()
      XCTFail("expected timeout")
    } catch {
      guard case SnackpubError.timeout = error else {
        return XCTFail("expected .timeout, got \(error)")
      }
    }
  }

  // MARK: - Steady state

  func testServerPingGetsPong() async throws {
    let socket = FakeWebSocket()
    let transport = makeHostTransport(socket: socket)
    completeHandshake(socket)
    try await transport.connect()
    socket.receive("2")
    try await Task.sleep(nanoseconds: 100_000_000)
    XCTAssertTrue(socket.sent.contains("3"))
  }

  func testCodeMessageUpdatesFilesAndEmitsEvent() async throws {
    let socket = FakeWebSocket()
    let transport = SnackpubTransport(channel: "c1", isStaging: false, mode: .viewer, socketFactory: { _ in socket })
    completeHandshake(socket)
    try await transport.connect()

    var iterator = transport.events.makeAsyncIterator()
    let diff = SnackDiff.generateUnifiedDiff(oldContents: "", newContents: "hello\n")
    let payload: [String: Any] = [
      "message": ["type": "CODE", "diff": ["App.js": diff], "s3url": [:], "dependencies": [:], "metadata": [:]]
    ]
    socket.receive(SnackpubFrame.eventPacket("message", data: payload)!)

    while let event = await iterator.next() {
      if case .filesUpdated(let files) = event {
        // Trailing-newline drop is the pinned SnackDiff.apply quirk
        XCTAssertEqual(files["App.js"]?.contents, "hello")
        return
      }
    }
    XCTFail("no filesUpdated event")
  }

  func testHostRepliesToResendCodeWithCurrentFiles() async throws {
    let socket = FakeWebSocket()
    let transport = makeHostTransport(socket: socket)
    completeHandshake(socket)
    try await transport.connect()
    await transport.sendFileUpdate(path: "App.js", oldContents: "x\n", newContents: "edited\n")

    socket.receive(SnackpubFrame.eventPacket("message", data: ["message": ["type": "RESEND_CODE"]])!)
    try await Task.sleep(nanoseconds: 100_000_000)

    let codeReplies = socket.sent.filter { $0.contains(#""CODE""#) }
    XCTAssertTrue(
      codeReplies.last?.contains("edited") == true,
      "RESEND_CODE reply must reflect edits, not original files"
    )
  }

  func testSendFileUpdateEmitsEditedOnce() async throws {
    let socket = FakeWebSocket()
    let transport = makeHostTransport(socket: socket)
    completeHandshake(socket)
    try await transport.connect()

    await transport.sendFileUpdate(path: "App.js", oldContents: "x\n", newContents: "y\n")
    await transport.sendFileUpdate(path: "App.js", oldContents: "y\n", newContents: "z\n")

    let edited = await transport.hasBeenEdited()
    XCTAssertTrue(edited)
    let files = await transport.currentFiles()
    XCTAssertEqual(files["App.js"]?.contents, "z\n")
  }

  // MARK: - Reconnect

  func testEditWhileDisconnectedIsQueuedAndFlushedOnReconnect() async throws {
    let socket1 = FakeWebSocket()
    let socket2 = FakeWebSocket()
    let sockets = LockedBox([socket1, socket2])
    let transport = SnackpubTransport(
      channel: "c1",
      isStaging: false,
      mode: .host(files: ["App.js": SnackFile(path: "App.js", contents: "x\n", isAsset: false)], dependencies: [:]),
      socketFactory: { _ in sockets.removeFirst() },
      connectTimeout: 1,
      reconnectBaseDelay: 0.05
    )
    completeHandshake(socket1)
    try await transport.connect()

    socket1.fail(URLError(.networkConnectionLost))
    try await Task.sleep(nanoseconds: 50_000_000)
    await transport.sendFileUpdate(path: "App.js", oldContents: "x\n", newContents: "offline edit\n")
    XCTAssertFalse(socket1.sent.contains { $0.contains("offline edit") }, "must not send on dead socket")

    completeHandshake(socket2)
    try await Task.sleep(nanoseconds: 500_000_000)  // backoff + handshake + flush
    XCTAssertTrue(
      socket2.sent.contains { $0.contains("offline edit") },
      "queued edit must flush after reconnect"
    )

    let files = await transport.currentFiles()
    XCTAssertEqual(files["App.js"]?.contents, "offline edit\n")
  }

  func testDeliberateDisconnectDoesNotReconnect() async throws {
    let socket = FakeWebSocket()
    let factoryCalls = LockedBox<Int>([])
    let transport = SnackpubTransport(
      channel: "c1", isStaging: false, mode: .viewer,
      socketFactory: { _ in
        factoryCalls.append(1)
        return socket
      },
      reconnectBaseDelay: 0.05
    )
    completeHandshake(socket)
    try await transport.connect()
    await transport.disconnect()
    try await Task.sleep(nanoseconds: 300_000_000)
    XCTAssertEqual(factoryCalls.count, 1, "factory must be called exactly once (initial), not for reconnects")
  }
}

/// Tiny thread-safe box for test factories (socket factories are called from
/// actor context).
private final class LockedBox<Element>: @unchecked Sendable {
  private let lock = NSLock()
  private var items: [Element]

  init(_ items: [Element]) { self.items = items }

  func removeFirst() -> Element {
    lock.lock(); defer { lock.unlock() }
    return items.removeFirst()
  }

  func append(_ item: Element) {
    lock.lock(); defer { lock.unlock() }
    items.append(item)
  }

  var count: Int {
    lock.lock(); defer { lock.unlock() }
    return items.count
  }
}
