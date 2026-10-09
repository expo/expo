// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesTestCore

@Suite("TestJavaScriptThread")
struct TestJavaScriptThreadTests {
  private final class Token {}

  /// The thread has to drop its reference to the operation before it wakes the caller. Otherwise
  /// `withoutActuallyEscaping` in `runAndWait` can still see that reference when it returns and
  /// traps with "closure argument was escaped in withoutActuallyEscaping block".
  @Test func `runAndWait releases the operation before it returns`() {
    let thread = TestJavaScriptThread()
    defer { thread.stopWhenIdle() }

    var leaked = 0
    for _ in 0..<20_000 {
      var token = Token()
      thread.runAndWait { [token] in
        withExtendedLifetime(token) {}
      }
      if !isKnownUniquelyReferenced(&token) {
        leaked += 1
      }
    }
    #expect(leaked == 0)
  }
}
