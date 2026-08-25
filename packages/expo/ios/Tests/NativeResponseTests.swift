// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import Testing

@testable import Expo

@Suite("NativeResponse")
struct NativeResponseTests {
  /**
   Drives the response state machine the way `ExpoURLSessionTask` does and drains the
   serial queue that every delegate callback hops onto.
   */
  private final class Harness {
    let queue = DispatchQueue(label: "expo.modules.fetch.tests.RequestQueue")
    let response: NativeResponse
    let session: ExpoURLSessionTask
    let task: URLSessionTask

    init() {
      response = NativeResponse(dispatchQueue: queue)
      session = ExpoURLSessionTask(delegate: response)
      // Never resumed, so no request is made. `handleDidCompleteWithError` only reads
      // `currentRequest` on the missing-local-file path, which these tests do not take.
      task = URLSession.shared.dataTask(with: URL(string: "https://example.test/")!)
    }

    func receiveResponse() {
      response.urlSessionDidStart(session)
      response.urlSession(
        session,
        didReceive: HTTPURLResponse(
          url: URL(string: "https://example.test/")!,
          statusCode: 200,
          httpVersion: "HTTP/1.1",
          headerFields: ["Transfer-Encoding": "chunked"]
        )!
      )
      drain()
    }

    func receive(_ data: Data) {
      response.urlSession(session, didReceive: data)
      drain()
    }

    func complete(with error: (any Error)?) {
      response.urlSession(session, task: task, didCompleteWithError: error)
      drain()
    }

    func startStreaming() throws -> Data? {
      return try queue.sync { try response.startStreaming() }
    }

    func cancel() {
      response.emitRequestCanceled()
      drain()
    }

    func redirect(mode: NativeRequestRedirect) {
      response.redirectMode = mode
      response.urlSession(
        session,
        task: task,
        willPerformHTTPRedirection: HTTPURLResponse(
          url: URL(string: "https://example.test/")!,
          statusCode: 302,
          httpVersion: "HTTP/1.1",
          headerFields: ["Location": "https://example.test/moved"]
        )!,
        newRequest: URLRequest(url: URL(string: "https://example.test/moved")!),
        completionHandler: { _ in }
      )
      drain()
    }

    private func drain() {
      queue.sync {}
    }
  }

  @Test
  func `startStreaming throws when the request failed before the body was read`() {
    // The request promise resolves as soon as headers land, so JS can hold a response
    // whose transport dies before anything reads `response.body`. `didFailWithError` is
    // emitted only from `.bodyStreamingStarted`, so nothing reaches the JS stream and
    // `startStreaming` has to be the one to report the failure.
    let harness = Harness()
    harness.receiveResponse()
    harness.complete(with: URLError(.networkConnectionLost))

    #expect(harness.response.state == .errorReceived)

    let error = #expect(throws: URLError.self) {
      _ = try harness.startStreaming()
    }
    #expect(error?.code == .networkConnectionLost)
  }

  @Test
  func `startStreaming rethrows a truncated chunked body error`() {
    let harness = Harness()
    harness.receiveResponse()
    harness.receive(Data("hello".utf8))
    harness.complete(with: URLError(.cannotParseResponse))

    let error = #expect(throws: URLError.self) {
      _ = try harness.startStreaming()
    }
    #expect(error?.code == .cannotParseResponse)
  }

  @Test
  func `startStreaming still returns the buffered body when the request succeeded`() throws {
    let harness = Harness()
    harness.receiveResponse()
    harness.receive(Data("hello world".utf8))
    harness.complete(with: nil)

    #expect(harness.response.state == .bodyCompleted)
    #expect(try harness.startStreaming() == Data("hello world".utf8))
  }

  @Test
  func `startStreaming still opens the stream while the body is in flight`() throws {
    let harness = Harness()
    harness.receiveResponse()

    #expect(try harness.startStreaming() == nil)
    #expect(harness.response.state == .bodyStreamingStarted)
  }

  @Test
  func `startStreaming throws after the request was canceled before the body was read`() {
    // `emitRequestCanceled` reaches `.errorReceived` through the same gate: it emits
    // `didFailWithError` only from `.bodyStreamingStarted`, so a cancel landing before
    // the body is read leaves the stream with nothing to settle it either.
    let harness = Harness()
    harness.receiveResponse()
    harness.cancel()

    #expect(harness.response.state == .errorReceived)
    #expect(throws: FetchRequestCanceledException.self) {
      _ = try harness.startStreaming()
    }
  }

  @Test
  func `startStreaming throws when a redirect was rejected before the body was read`() {
    // Same gate again, via `redirect: "error"`.
    let harness = Harness()
    harness.receiveResponse()
    harness.redirect(mode: .error)

    #expect(harness.response.state == .errorReceived)
    #expect(throws: FetchRedirectException.self) {
      _ = try harness.startStreaming()
    }
  }

  @Test
  func `a followed redirect still streams normally`() throws {
    let harness = Harness()
    harness.receiveResponse()
    harness.redirect(mode: .follow)

    #expect(harness.response.state == .responseReceived)
    #expect(try harness.startStreaming() == nil)
  }
}
