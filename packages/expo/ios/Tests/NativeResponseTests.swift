// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
import Testing
@testable import Expo

@Suite
struct NativeResponseTests {
  @Test
  func `cancel before the first read discards the buffered body`() {
    let queue = DispatchQueue(label: "NativeResponseTests")
    let response = NativeResponse(dispatchQueue: queue)
    let task = ExpoURLSessionTask(delegate: response)
    let url = URL(string: "https://example.test/")!

    response.urlSessionDidStart(task)
    response.urlSession(task, didReceive: URLResponse(url: url, mimeType: nil, expectedContentLength: -1, textEncodingName: nil))
    response.urlSession(task, didReceive: Data("buffered".utf8))
    queue.sync {
      response.cancelStreaming()
    }
    response.urlSession(task, didReceive: Data("late".utf8))

    queue.sync {
      #expect(response.state == .bodyStreamingCanceled)
      #expect(response.sink.finalize().isEmpty)
    }
  }
}
