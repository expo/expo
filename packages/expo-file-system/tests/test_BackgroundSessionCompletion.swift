import Foundation

func assertEqual<T: Equatable>(_ actual: T, _ expected: T, file: StaticString = #file, line: UInt = #line) {
  precondition(actual == expected, "Expected \(expected), got \(actual)", file: file, line: line)
}

final class BackgroundSessionCompletionTests {
  func testWaitsForEverySuccessfulDownloadAndFinalEvent() {
    let state = BackgroundSessionCompletion()
    let first = NSObject(), second = NSObject(), active = NSObject()
    var calls = 0
    state.receiveHandler("session") { calls += 1 }
    for task in [first, second, active] { state.register(task, session: "session") }
    state.finish(first, succeeded: true)
    state.finish(second, succeeded: true)
    state.discard(first)
    assertEqual(calls, 0)
    state.finishEvents("session")
    assertEqual(calls, 0)
    state.discard(second)
    assertEqual(calls, 1)
    state.discard(second)
    state.finishEvents("session")
    assertEqual(calls, 1)
  }

  func testDeadlineNeverPrecedesFinalEvent() {
    let state = BackgroundSessionCompletion(), task = NSObject()
    var calls = 0
    let token = state.receiveHandler("session") { calls += 1 }
    state.register(task, session: "session")
    state.finish(task, succeeded: true)
    state.expire("session", token: token)
    assertEqual(calls, 0)
    state.finishEvents("session")
    assertEqual(calls, 1)
    state.discard(task)
    state.expire("session", token: token)
    assertEqual(calls, 1)
  }

  func testDeadlineReleasesUnacknowledgedDownloadAfterFinalEvent() {
    let state = BackgroundSessionCompletion(), task = NSObject()
    var calls = 0
    let token = state.receiveHandler("session") { calls += 1 }
    state.register(task, session: "session")
    state.finish(task, succeeded: true)
    state.finishEvents("session")
    assertEqual(calls, 0)
    state.expire("session", token: token)
    assertEqual(calls, 1)
  }

  func testForegroundAndFailedSaveDoNotDelayLaterWake() {
    let state = BackgroundSessionCompletion(), foreground = NSObject(), failed = NSObject()
    state.register(foreground, session: "session")
    state.finish(foreground, succeeded: true)
    var calls = 0
    state.receiveHandler("session") { calls += 1 }
    state.register(failed, session: "session")
    state.finish(failed, succeeded: false)
    state.finishEvents("session")
    assertEqual(calls, 1)
  }

  func testReleaseAndCancellationDropRegistration() {
    let state = BackgroundSessionCompletion(), task = NSObject()
    var calls = 0
    state.receiveHandler("session") { calls += 1 }
    state.register(task, session: "session")
    state.finish(task, succeeded: true)
    state.finishEvents("session")
    state.discard(task)
    assertEqual(calls, 1)
  }

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
    assertEqual(calls, 1)
    state.expire("session", token: current)
    assertEqual(calls, 2)
  }

  func testDefaultAndOtherSessionsRemainIndependent() {
    let state = BackgroundSessionCompletion(), task = NSObject()
    var completed: [String] = []
    state.receiveHandler("deferred") { completed.append("deferred") }
    state.register(task, session: "deferred")
    state.finish(task, succeeded: true)
    state.receiveHandler("default") { completed.append("default") }
    state.finishEvents("default")
    state.finishEvents("deferred")
    assertEqual(completed, ["default"])
    state.discard(task)
    assertEqual(completed, ["default", "deferred"])
  }
}


let tests = BackgroundSessionCompletionTests()
tests.testWaitsForEverySuccessfulDownloadAndFinalEvent()
tests.testDeadlineNeverPrecedesFinalEvent()
tests.testDeadlineReleasesUnacknowledgedDownloadAfterFinalEvent()
tests.testForegroundAndFailedSaveDoNotDelayLaterWake()
tests.testReleaseAndCancellationDropRegistration()
tests.testOldTimerCannotCompleteNewWake()
tests.testDefaultAndOtherSessionsRemainIndependent()
print("7 background-session lifecycle tests passed")
