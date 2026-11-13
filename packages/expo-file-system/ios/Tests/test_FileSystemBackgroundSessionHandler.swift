// Copyright 2026-present 650 Industries. All rights reserved.

#if os(iOS) || os(tvOS)
import Testing
import UIKit

@testable import ExpoFileSystem

@Suite("Background session handler")
struct FileSystemBackgroundSessionHandlerTests {
  @Test
  @MainActor
  func testCompletesAtOnceForSessionOfAnotherModule() {
    let handler = FileSystemBackgroundSessionHandler()
    var calls = 0
    handler.application(UIApplication.shared, handleEventsForBackgroundURLSession: "com.example.other-module.background") {
      calls += 1
    }
    #expect(calls == 1)
  }

  @Test
  @MainActor
  func testLegacySingletonCompletesAtOnce() {
    let handler: UIApplicationDelegate = EXSessionHandler()
    var calls = 0
    handler.application?(UIApplication.shared, handleEventsForBackgroundURLSession: "com.example.any.background") {
      calls += 1
    }
    #expect(calls == 1)
  }
}
#endif
