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

  init() {
    let state = State()
    self.state = state
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

  var opaquePointer: UnsafeMutableRawPointer {
    return Unmanaged.passUnretained(self).toOpaque()
  }

  func schedule(_ operation: @escaping @convention(block) () -> Void) {
    state.schedule(operation)
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

  private final class State: @unchecked Sendable {
    private let condition = NSCondition()
    private let ready = DispatchSemaphore(value: 0)
    private var operations: [@convention(block) () -> Void] = []
    private var isStopped = false

    func schedule(_ operation: @escaping @convention(block) () -> Void) {
      condition.lock()
      operations.append(operation)
      condition.signal()
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
    let scheduler = Unmanaged<TestRuntimeScheduler>.fromOpaque(schedulerPointer).takeUnretainedValue()
    scheduler.schedule(callback)
  }
