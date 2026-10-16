// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation

/// A scheduler with a thread of its own, for tests whose runtime work has to be serialized with work
/// arriving from other threads, such as a promise settled from a detached task. A standalone
/// `JavaScriptRuntime()` has no JavaScript thread and runs scheduled work inline on whatever thread
/// calls `schedule`, so such a settle would run JavaScript concurrently with the test body. A runtime
/// made with ``makeRuntime()`` dispatches scheduled work to this scheduler's thread instead.
final class TestRuntimeScheduler: @unchecked Sendable {
  // A serial dispatch queue may use different worker threads between callbacks, but
  // JavaScriptRuntime tracks affinity to the specific thread on which it was created.
  private let state: State
  private let thread: Thread

  /// What the runtime gets as its opaque scheduler pointer. A retained `State` that is never released,
  /// like the handle React Native's host passes: the runtime may dispatch to it after this scheduler is
  /// gone, for example when a callback is released on another thread at the end of a test. `State`
  /// drops work that arrives after `stop()`.
  let opaquePointer: UnsafeMutableRawPointer

  init() {
    let state = State()
    self.state = state
    self.opaquePointer = Unmanaged.passRetained(state).toOpaque()
    self.thread = Thread {
      state.run()
    }
    thread.name = "expo.modules.jsi.tests.runtime"
    thread.start()
    state.waitUntilReady()
  }

  deinit {
    state.stop()
  }

  func schedule(_ operation: @escaping @convention(block) () -> Void) {
    state.schedule(operation)
  }

  /// Blocks the calling thread until at least `count` operations wait in the queue.
  func waitUntilQueued(_ count: Int) {
    state.waitUntilQueued(count)
  }

  func run<R: Sendable>(_ operation: @escaping @Sendable () -> R) async -> R {
    return await withCheckedContinuation { continuation in
      schedule {
        continuation.resume(returning: operation())
      }
    }
  }

  /// Runs a throwing, actor-isolated operation on the scheduler's thread. Test bodies run on
  /// whatever thread the cooperative pool picks, so any work that touches the runtime goes through
  /// this to stay on the runtime's thread.
  func runIsolated<R: Sendable>(_ operation: @escaping @Sendable @JavaScriptActor () throws -> R) async throws -> R {
    return try await withCheckedThrowingContinuation { continuation in
      schedule {
        continuation.resume(with: Result { try JavaScriptActor.assumeIsolated(operation) })
      }
    }
  }

  /// Creates a runtime on the scheduler's thread and wraps it in a non-owning runtime whose scheduled
  /// work dispatches back to that thread.
  func makeRuntime() async -> TestRuntime {
    let owningRuntime = await run {
      JavaScriptRuntime()
    }
    let runtime = await run {
      owningRuntime.withUnsafePointee { runtimePointer in
        JavaScriptRuntime(
          unsafePointer: runtimePointer,
          scheduler: self.opaquePointer,
          dispatch: unsafeBitCast(scheduleOnTestRuntime, to: UnsafeRawPointer.self)
        )
      }
    }
    return TestRuntime(scheduler: self, owningRuntime: owningRuntime, runtime: runtime)
  }

  fileprivate final class State: @unchecked Sendable {
    private let condition = NSCondition()
    private let ready = DispatchSemaphore(value: 0)
    private var operations: [@convention(block) () -> Void] = []
    private var isStopped = false

    func schedule(_ operation: @escaping @convention(block) () -> Void) {
      condition.lock()
      guard !isStopped else {
        condition.unlock()
        return
      }
      operations.append(operation)
      condition.broadcast()
      condition.unlock()
    }

    func waitUntilQueued(_ count: Int) {
      condition.lock()
      while operations.count < count && !isStopped {
        condition.wait()
      }
      condition.unlock()
    }

    func waitUntilReady() {
      ready.wait()
    }

    func stop() {
      condition.lock()
      isStopped = true
      condition.signal()
      condition.unlock()
    }

    func run() {
      ready.signal()

      while true {
        condition.lock()
        while operations.isEmpty && !isStopped {
          condition.wait()
        }
        if isStopped {
          condition.unlock()
          return
        }
        let operation = operations.removeFirst()
        condition.unlock()

        operation()
      }
    }
  }
}

/// A runtime bound to a ``TestRuntimeScheduler``. Holds the owning runtime and the scheduler so both
/// outlive the non-owning wrapper that tests use.
struct TestRuntime: Sendable {
  let scheduler: TestRuntimeScheduler
  let owningRuntime: JavaScriptRuntime
  let runtime: JavaScriptRuntime
}

/// Carries a non-`Sendable`, possibly non-copyable value out of a ``TestRuntimeScheduler/runIsolated(_:)``
/// block. A class so that a `~Copyable` value can ride through the copyable generics of Swift
/// concurrency. The value is only ever used on the scheduler's thread or after the runtime is idle,
/// which is what makes this sound in the tests that use it.
final class UncheckedSendable<Value: ~Copyable>: @unchecked Sendable {
  let value: Value

  init(value: consuming Value) {
    self.value = value
  }
}

let scheduleOnTestRuntime:
  @convention(c) (
    UnsafeMutableRawPointer?, Int32, @escaping @convention(block) () -> Void
  ) -> Void = { schedulerPointer, _, callback in
    guard let schedulerPointer else {
      return
    }
    let state = Unmanaged<TestRuntimeScheduler.State>.fromOpaque(schedulerPointer).takeUnretainedValue()
    state.schedule(callback)
  }

/// A runtime on a ``TestRuntimeScheduler``'s thread that a test releases at a chosen point, to check
/// what happens to work that was queued while the runtime was alive and runs after it is gone.
final class ReleasableTestRuntime: @unchecked Sendable {
  let scheduler = TestRuntimeScheduler()
  private var owningRuntime: JavaScriptRuntime?
  private(set) var runtime: JavaScriptRuntime?

  init() async {
    let runtimes = await scheduler.run { [scheduler] in
      let owningRuntime = JavaScriptRuntime()
      let runtime = owningRuntime.withUnsafePointee { runtimePointer in
        JavaScriptRuntime(
          unsafePointer: runtimePointer,
          scheduler: scheduler.opaquePointer,
          dispatch: unsafeBitCast(scheduleOnTestRuntime, to: UnsafeRawPointer.self)
        )
      }
      return UncheckedSendable(value: (owningRuntime, runtime))
    }
    self.owningRuntime = runtimes.value.0
    self.runtime = runtimes.value.1
  }

  /// Holds the JavaScript thread, calls `enqueue` on another thread and waits until it queued its work,
  /// then releases the runtime on the JavaScript thread, so the queued work runs after the runtime is
  /// gone. Returns once that work ran.
  func releaseRuntime(afterQueueing enqueue: @escaping @Sendable () -> Void) async {
    let isHolding = DispatchSemaphore(value: 0)
    let release = DispatchSemaphore(value: 0)
    scheduler.schedule {
      isHolding.signal()
      release.wait()
      self.runtime = nil
    }
    // The waits block, so they run on a thread of their own rather than in this async context.
    await withCheckedContinuation { (finished: CheckedContinuation<Void, Never>) in
      Thread.detachNewThread { [scheduler] in
        isHolding.wait()
        Thread.detachNewThread(enqueue)
        scheduler.waitUntilQueued(1)
        release.signal()
        // Queued behind the work that `enqueue` queued, so it resumes the test after that work ran.
        scheduler.schedule {
          finished.resume()
        }
      }
    }
  }

  /// Releases the owning runtime on the JavaScript thread. Call at the end of the test.
  func tearDown() async {
    await scheduler.run {
      self.runtime = nil
      self.owningRuntime = nil
    }
  }
}
