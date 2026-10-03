// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Minimal WebSocket seam so SnackpubTransport is testable with a scripted fake.
protocol WebSocketConnecting: Sendable {
  /// Text frames received from the peer. Finishes with an error on failure,
  /// finishes normally after close().
  var messages: AsyncThrowingStream<String, Error> { get }
  func connect()
  func send(_ text: String) async throws
  func close()
}

final class URLSessionWebSocket: WebSocketConnecting, @unchecked Sendable {
  private let task: URLSessionWebSocketTask
  private let session: URLSession
  let messages: AsyncThrowingStream<String, Error>
  private let continuation: AsyncThrowingStream<String, Error>.Continuation

  init(url: URL) {
    session = URLSession(configuration: .default)
    task = session.webSocketTask(with: url)
    (messages, continuation) = AsyncThrowingStream.makeStream()
  }

  func connect() {
    task.resume()
    receiveLoop()
  }

  private func receiveLoop() {
    task.receive { [weak self] result in
      guard let self else { return }
      switch result {
      case .success(let message):
        if case .string(let text) = message {
          self.continuation.yield(text)
        }
        self.receiveLoop()
      case .failure(let error):
        self.continuation.finish(throwing: error)
      }
    }
  }

  func send(_ text: String) async throws {
    try await task.send(.string(text))
  }

  func close() {
    task.cancel(with: .goingAway, reason: nil)
    session.invalidateAndCancel()
    continuation.finish()
  }
}
