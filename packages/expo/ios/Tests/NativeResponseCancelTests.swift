// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
import OSLog
import Testing

@testable import Expo

@Suite
struct NativeResponseCancelTests {
  @Test
  func cancelAfterTheBodySettledDoesNotLogAndLeavesTheState() throws {
    let probe = NativeResponse(dispatchQueue: DispatchQueue(label: "expo-fetch-cancel-probe"))
    let probeLogs = try invalidStateLogs {
      probe.cancelStreaming()
    }
    #expect(!probeLogs.isEmpty)

    for state in [ResponseState.bodyCompleted, .bodyStreamingCanceled, .errorReceived] {
      let response = try settledResponse(state)
      let logs = try invalidStateLogs {
        response.cancelStreaming()
      }
      #expect(logs.isEmpty)
      #expect(response.state == state)
    }
  }

  private func settledResponse(_ state: ResponseState) throws -> NativeResponse {
    let queue = DispatchQueue(label: "expo-fetch-cancel-test")
    let response = NativeResponse(dispatchQueue: queue)
    let sessionTask = ExpoURLSessionTask(delegate: response)
    let url = try #require(URL(string: "https://example.com/"))
    let http = try #require(
      HTTPURLResponse(url: url, statusCode: 200, httpVersion: nil, headerFields: nil)
    )

    switch state {
    case .errorReceived:
      response.emitRequestCanceled()
    case .bodyCompleted:
      response.urlSessionDidStart(sessionTask)
      queue.sync {}
      response.urlSession(sessionTask, didReceive: http)
      queue.sync {}
      let task = URLSession(configuration: .ephemeral).dataTask(with: url)
      response.urlSession(sessionTask, task: task, didCompleteWithError: nil)
      queue.sync {}
    case .bodyStreamingCanceled:
      response.urlSessionDidStart(sessionTask)
      queue.sync {}
      response.urlSession(sessionTask, didReceive: http)
      queue.sync {}
      _ = response.startStreaming()
      response.cancelStreaming()
    default:
      Issue.record("\(state) is not a settled state")
    }

    #expect(response.state == state)
    return response
  }

  private func invalidStateLogs(during body: () -> Void) throws -> [String] {
    let store = try OSLogStore(scope: .currentProcessIdentifier)
    let position = store.position(date: Date())
    body()

    let deadline = Date().addingTimeInterval(0.3)
    var matched: [String] = []
    while true {
      matched = try store.getEntries(at: position).compactMap { entry in
        guard let logEntry = entry as? OSLogEntryLog else {
          return nil
        }
        return logEntry.composedMessage.contains("Invalid state") ? logEntry.composedMessage : nil
      }
      if !matched.isEmpty || Date() >= deadline {
        return matched
      }
      Thread.sleep(forTimeInterval: 0.02)
    }
  }
}
