//  Copyright (c) 2026 650 Industries, Inc. All rights reserved.

import Foundation
import Testing

@testable import EXUpdates

private struct StubUnderlyingError: Error, LocalizedError {
  var errorDescription: String? {
    "HTTP response error 502: upstream unavailable"
  }
}

/**
 The message a rejected promise delivers to JavaScript is derived from the exception's `reason`,
 via `String(reflecting:)` -> `Exception.debugDescription`. It is NOT derived from `description`,
 so `Promise.reject(code:description:)` and `Exception(name:description:code:)` silently drop the
 description they are given. These tests pin the behavior the module relies on instead.
 */
@Suite("Updates exceptions")
struct UpdatesExceptionsTests {
  @Test
  func `check exception carries the underlying description to JavaScript`() {
    let exception = CheckForUpdateException(StubUnderlyingError())

    #expect(exception.code == "ERR_UPDATES_CHECK")
    #expect(exception.reason == "Failed to check for update: HTTP response error 502: upstream unavailable")
    #expect(String(reflecting: exception).contains("HTTP response error 502: upstream unavailable"))
  }

  @Test
  func `fetch exception carries the underlying description to JavaScript`() {
    let exception = FetchUpdateException(StubUnderlyingError())

    #expect(exception.code == "ERR_UPDATES_FETCH")
    #expect(exception.reason == "Failed to download new update: HTTP response error 502: upstream unavailable")
    #expect(String(reflecting: exception).contains("HTTP response error 502: upstream unavailable"))
  }

  @Test
  func `log entry exceptions carry the underlying description to JavaScript`() {
    let readException = ReadLogEntriesException(StubUnderlyingError())
    let clearException = ClearLogEntriesException(StubUnderlyingError())

    #expect(readException.code == "ERR_UPDATES_READ_LOGS")
    #expect(clearException.code == "ERR_UPDATES_READ_LOGS")
    #expect(String(reflecting: readException).contains("upstream unavailable"))
    #expect(String(reflecting: clearException).contains("upstream unavailable"))
  }
}
