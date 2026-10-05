// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
import Testing

@testable import ExpoFileSystem

@Suite("Background session completion")
struct BackgroundSessionCompletionTests {
  @Test
  func testWaitsForEverySuccessfulDownloadAndFinalEvent() {
    let state = BackgroundSessionCompletion()
    let first = NSObject(), second = NSObject(), active = NSObject()
    var calls = 0
    state.receiveHandler("session") { calls += 1 }
    for task in [first, second, active] { state.register(task, session: "session") }
    state.finish(first, succeeded: true)
    state.finish(second, succeeded: true)
    state.discard(first)
    #expect(calls == 0)
    state.finishEvents("session")
    #expect(calls == 0)
    state.discard(second)
    #expect(calls == 1)
    state.discard(second)
    state.finishEvents("session")
    #expect(calls == 1)
  }

  @Test
  func testDeadlineNeverPrecedesFinalEvent() {
    let state = BackgroundSessionCompletion(), task = NSObject()
    var calls = 0
    let token = state.receiveHandler("session") { calls += 1 }
    state.register(task, session: "session")
    state.finish(task, succeeded: true)
    state.expire("session", token: token)
    #expect(calls == 0)
    state.finishEvents("session")
    #expect(calls == 1)
    state.discard(task)
    state.expire("session", token: token)
    #expect(calls == 1)
  }

  @Test
  func testDeadlineReleasesUnacknowledgedDownloadAfterFinalEvent() {
    let state = BackgroundSessionCompletion(), task = NSObject()
    var calls = 0
    let token = state.receiveHandler("session") { calls += 1 }
    state.register(task, session: "session")
    state.finish(task, succeeded: true)
    state.finishEvents("session")
    #expect(calls == 0)
    state.expire("session", token: token)
    #expect(calls == 1)
  }

  @Test
  func testForegroundAndFailedSaveDoNotDelayLaterWake() {
    let state = BackgroundSessionCompletion(), foreground = NSObject(), failed = NSObject()
    state.register(foreground, session: "session")
    state.finish(foreground, succeeded: true)
    var calls = 0
    state.receiveHandler("session") { calls += 1 }
    state.register(failed, session: "session")
    state.finish(failed, succeeded: false)
    state.finishEvents("session")
    #expect(calls == 1)
  }

  @Test
  func testReleaseAndCancellationDropRegistration() {
    let state = BackgroundSessionCompletion(), task = NSObject()
    var calls = 0
    state.receiveHandler("session") { calls += 1 }
    state.register(task, session: "session")
    state.finish(task, succeeded: true)
    state.finishEvents("session")
    state.discard(task)
    #expect(calls == 1)
  }

  @Test
  func testOldTimerCannotCompleteNewWake() {
    let state = BackgroundSessionCompletion(), task = NSObject()
    var calls = 0
    let old = state.receiveHandler("session") { calls += 1 }
    state.finishEvents("session")
    let current = state.receiveHandler("session") { calls += 1 }
    state.register(task, session: "session")
    state.finish(task, succeeded: true)
    state.finishEvents("session")
    state.expire("session", token: old)
    #expect(calls == 1)
    state.expire("session", token: current)
    #expect(calls == 2)
  }

  @Test
  func testDefaultAndOtherSessionsRemainIndependent() {
    let state = BackgroundSessionCompletion(), task = NSObject()
    var completed: [String] = []
    state.receiveHandler("deferred") { completed.append("deferred") }
    state.register(task, session: "deferred")
    state.finish(task, succeeded: true)
    state.receiveHandler("default") { completed.append("default") }
    state.finishEvents("default")
    state.finishEvents("deferred")
    #expect(completed == ["default"])
    state.discard(task)
    #expect(completed == ["default", "deferred"])
  }

  @Test
  func testDuplicateHandlerPreservesAcknowledgmentsAndBothCompletions() {
    let state = BackgroundSessionCompletion(), task = NSObject()
    var completed: [String] = []
    let original = state.receiveHandler("session") { completed.append("original") }
    state.register(task, session: "session")
    state.finish(task, succeeded: true)
    let duplicate = state.receiveHandler("session") { completed.append("duplicate") }
    #expect(completed.isEmpty)
    state.finishEvents("session")
    #expect(completed.isEmpty)
    state.discard(task)
    #expect(completed == ["original", "duplicate"])
    state.finishEvents("session")
    state.expire("session", token: original)
    state.expire("session", token: duplicate)
    #expect(completed == ["original", "duplicate"])
  }

  @Test
  func testDuplicateHandlerWaitsForItsFinalEvent() {
    let state = BackgroundSessionCompletion(), task = NSObject()
    var completed: [String] = []
    state.receiveHandler("session") { completed.append("original") }
    state.register(task, session: "session")
    state.finish(task, succeeded: true)
    state.finishEvents("session")
    state.receiveHandler("session") { completed.append("duplicate") }
    #expect(completed.isEmpty)
    state.discard(task)
    #expect(completed.isEmpty)
    state.finishEvents("session")
    #expect(completed == ["original", "duplicate"])
  }

  @Test
  func testDuplicateHandlerDoesNotExtendDeadline() {
    let state = BackgroundSessionCompletion(), task = NSObject()
    var completed: [String] = []
    let token = state.receiveHandler("session") { completed.append("original") }
    state.register(task, session: "session")
    state.finish(task, succeeded: true)
    state.receiveHandler("session") { completed.append("duplicate") }
    state.finishEvents("session")
    #expect(completed.isEmpty)
    state.expire("session", token: token)
    #expect(completed == ["original", "duplicate"])
  }

  @Test
  func testDuplicateHandlerPreservesExpiredDeadlineAndWaitsForFinalEvent() {
    let state = BackgroundSessionCompletion(), task = NSObject()
    var completed: [String] = []
    let token = state.receiveHandler("session") { completed.append("original") }
    state.register(task, session: "session")
    state.finish(task, succeeded: true)
    state.expire("session", token: token)
    state.receiveHandler("session") { completed.append("duplicate") }
    #expect(completed.isEmpty)
    state.finishEvents("session")
    #expect(completed == ["original", "duplicate"])
  }
}
