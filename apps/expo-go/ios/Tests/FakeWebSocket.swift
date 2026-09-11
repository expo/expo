// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
@testable import Expo_Go

/// Scripted WebSocket for transport tests: records sends, lets tests inject
/// incoming frames and failures.
final class FakeWebSocket: WebSocketConnecting, @unchecked Sendable {
  let messages: AsyncThrowingStream<String, Error>
  private let continuation: AsyncThrowingStream<String, Error>.Continuation
  private let lock = NSLock()
  private var _sent: [String] = []
  var onSend: ((String) -> Void)?

  var sent: [String] {
    lock.lock(); defer { lock.unlock() }
    return _sent
  }

  init() {
    (messages, continuation) = AsyncThrowingStream.makeStream()
  }

  func connect() {}

  func send(_ text: String) async throws {
    lock.lock()
    _sent.append(text)
    lock.unlock()
    onSend?(text)
  }

  func close() { continuation.finish() }

  // MARK: - Test controls

  func receive(_ text: String) { continuation.yield(text) }
  func fail(_ error: Error) { continuation.finish(throwing: error) }
}
