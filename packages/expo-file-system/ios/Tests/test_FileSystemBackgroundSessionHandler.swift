// Copyright 2026-present 650 Industries. All rights reserved.

#if os(iOS) || os(tvOS)
import ExpoModulesCore
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

  #if os(iOS)
  @Test
  @MainActor
  func testCompletesAtOnceForBackgroundSessionNotCreatedInThisProcess() {
    let handler = FileSystemBackgroundSessionHandler()
    var calls = 0
    handler.application(UIApplication.shared, handleEventsForBackgroundURLSession: NetworkTaskSessionManager.backgroundSessionIdentifier) {
      calls += 1
    }
    #expect(calls == 1)
  }
  #endif

  @Test
  @MainActor
  func testWaitsForFinalEventOfRegisteredSession() async {
    let handler = FileSystemBackgroundSessionHandler()
    handler.registerSession("com.example.registered.background")
    var calls = 0
    handler.application(UIApplication.shared, handleEventsForBackgroundURLSession: "com.example.registered.background") {
      calls += 1
    }
    #expect(calls == 0)
    handler.invokeCompletionHandler(forSessionIdentifier: "com.example.registered.background")
    // invokeCompletionHandler completes on a later main queue turn.
    await withCheckedContinuation { continuation in
      DispatchQueue.main.async { continuation.resume() }
    }
    #expect(calls == 1)
  }

  #if os(iOS)
  @Test
  @MainActor
  func testCreatesBackgroundSessionOffTheMainThread() async {
    // `UploadTask.start` creates the background session on the module queue. A lookup in the
    // `@MainActor` subscriber repository there traps, but only when a subscriber is registered.
    ExpoAppDelegateSubscriberRepository.registerSubscriber(FileSystemBackgroundSessionHandler())
    let identifier = await Task.detached {
      NetworkTaskSessionManager.shared.session(for: .background).configuration.identifier
    }.value
    #expect(identifier == NetworkTaskSessionManager.backgroundSessionIdentifier)
  }
  #endif

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
