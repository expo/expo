// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
import Testing

/// Values that release their JSI state on `deinit` can be dropped on the JavaScript thread while React
/// Native's scheduler holds its mutex, when `RuntimeScheduler_Modern::clearQueues()` destroys the
/// queued tasks after a JavaScript error. Scheduling the release from that thread would deadlock.
/// Serialized, because the tests share ``testHostSchedulerLock``.
@Suite(.serialized)
struct SchedulerReentrancyTests {
  @Test
  func `dropping a promise on the JavaScript thread releases it without scheduling from that thread`() async throws {
    let testRuntime = await ReleasableTestRuntime(dispatch: scheduleOnTestRuntimeUnlessHostLocked)
    let blockedBefore = testHostSchedulerLock.blockedDispatchCount

    let registeredCounts = try await testRuntime.scheduler.runIsolated {
      let runtime = try #require(testRuntime.runtime)
      let promise = try JavaScriptPromise(runtime)
      let before = runtime.longLivedObjects.count
      dropWhileHostLocked(promise)
      return (before, runtime.longLivedObjects.count)
    }

    #expect(testHostSchedulerLock.blockedDispatchCount == blockedBefore)
    #expect(try await isReleased(in: testRuntime, registeredBefore: registeredCounts.0))
    await testRuntime.tearDown()
  }

  @Test
  func `dropping a promise on the JavaScript thread after resolving it still settles it`() async throws {
    let testRuntime = await TestRuntimeScheduler().makeRuntime()

    let chained = try await testRuntime.scheduler.runIsolated {
      let runtime = testRuntime.runtime
      let promise = try JavaScriptPromise(runtime)
      runtime.global().setProperty("testPromise", value: promise.asValue())
      let chained = try runtime.eval("globalThis.testPromise.then((value) => value)").getPromise()
      // The resolve runs in a task on the JavaScript thread, after this block. The wrapper is
      // dropped here first, so its release must not run before that task.
      promise.resolve(42)
      _ = consume promise
      return UncheckedSendable(value: chained)
    }

    let result = SettledValue()
    Task {
      result.set(try? await chained.value.await().getInt())
    }
    let deadline = ContinuousClock.now + .seconds(10)
    while result.value == nil && ContinuousClock.now < deadline {
      try await Task.sleep(for: .milliseconds(10))
    }

    #expect(result.value == 42)
  }

  @Test
  func `promises dropped together on the JavaScript thread share release tasks`() async throws {
    let testRuntime = await ReleasableTestRuntime(dispatch: scheduleOnTestRuntimeCounting)
    let dispatchesBefore = testDispatchCounter.count

    let registeredBefore = try await testRuntime.scheduler.runIsolated {
      let runtime = try #require(testRuntime.runtime)
      let before = runtime.longLivedObjects.count
      for _ in 0..<100 {
        _ = try JavaScriptPromise(runtime)
      }
      return before
    }

    #expect(try await isReleased(in: testRuntime, registeredBefore: registeredBefore, count: registeredBefore))
    // One task per release would be 100 dispatches.
    #expect(testDispatchCounter.count - dispatchesBefore < 100)
    await testRuntime.tearDown()
  }

  @Test
  func `promises resolved and then dropped on the JavaScript thread all settle`() async throws {
    let testRuntime = await TestRuntimeScheduler().makeRuntime()

    let all = try await testRuntime.scheduler.runIsolated {
      let runtime = testRuntime.runtime
      _ = try runtime.eval("globalThis.chained = []")
      for index in 0..<100 {
        let promise = try JavaScriptPromise(runtime)
        runtime.global().setProperty("testPromise", value: promise.asValue())
        _ = try runtime.eval("globalThis.chained.push(globalThis.testPromise.then((value) => value))")
        promise.resolve(Double(index))
        _ = consume promise
      }
      let all = try runtime.eval("Promise.all(globalThis.chained).then((values) => values.length)")
      return UncheckedSendable(value: try all.getPromise())
    }

    let result = SettledValue()
    Task {
      result.set(try? await all.value.await().getInt())
    }
    let deadline = ContinuousClock.now + .seconds(10)
    while result.value == nil && ContinuousClock.now < deadline {
      try await Task.sleep(for: .milliseconds(10))
    }

    #expect(result.value == 100)
  }

  @Test
  func `dropping a callback on the JavaScript thread releases it without scheduling from that thread`() async throws {
    let testRuntime = await ReleasableTestRuntime(dispatch: scheduleOnTestRuntimeUnlessHostLocked)
    let blockedBefore = testHostSchedulerLock.blockedDispatchCount

    let registeredCounts = try await testRuntime.scheduler.runIsolated {
      let runtime = try #require(testRuntime.runtime)
      let value = try runtime.eval("(() => {})")
      let callback = try value.withUnownedValue(in: runtime) { unownedValue in
        try JavaScriptCallback.decode(unownedValue, in: runtime)
      }
      let before = runtime.longLivedObjects.count
      testHostSchedulerLock.acquire()
      _ = consume callback
      testHostSchedulerLock.release()
      return (before, runtime.longLivedObjects.count)
    }

    #expect(testHostSchedulerLock.blockedDispatchCount == blockedBefore)
    #expect(try await isReleased(in: testRuntime, registeredBefore: registeredCounts.0))
    await testRuntime.tearDown()
  }
}

/// Ends the promise's lifetime while ``testHostSchedulerLock`` is held, so its `deinit` runs there.
@JavaScriptActor
private func dropWhileHostLocked(_ promise: consuming JavaScriptPromise) {
  testHostSchedulerLock.acquire()
  _ = consume promise
  testHostSchedulerLock.release()
}

/// The settled value of a promise, set by a task that the test polls.
private final class SettledValue: @unchecked Sendable {
  private let lock = NSLock()
  private var storedValue: Int?

  var value: Int? {
    lock.withLock { storedValue }
  }

  func set(_ value: Int?) {
    lock.withLock { storedValue = value }
  }
}

/// Polls until the dropped values' long-lived state is deregistered, which happens in a task that the
/// runtime schedules later, so that `count` objects are registered. Returns `false` if that does not
/// happen in time.
private func isReleased(
  in testRuntime: ReleasableTestRuntime,
  registeredBefore: Int,
  count: Int? = nil
) async throws -> Bool {
  let expected = count ?? registeredBefore - 1
  let deadline = ContinuousClock.now + .seconds(10)
  while ContinuousClock.now < deadline {
    let registered = try await testRuntime.scheduler.runIsolated {
      try #require(testRuntime.runtime).longLivedObjects.count
    }
    if registered == expected {
      return true
    }
    try await Task.sleep(for: .milliseconds(10))
  }
  return false
}
