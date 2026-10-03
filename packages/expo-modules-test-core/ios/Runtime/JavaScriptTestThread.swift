// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation

/// A JavaScript thread for tests, with an app context whose runtime runs its scheduled work there.
///
/// The runtime of `AppContext.create()` has no JavaScript thread: it runs scheduled work inline on
/// whatever thread calls `schedule`. Once an async function body resumes on a cooperative thread, it
/// settles its promise from there, concurrently with the test that may still be evaluating JavaScript
/// on the same runtime, which Hermes does not survive. Use this instead in tests that await such
/// functions. Keep it alive for as long as the app context is used, for example as a stored property
/// of the suite, and get the runtime from `appContext.runtime` rather than storing it, so that it is
/// released before the Hermes runtime when the thread tears down.
///
/// `expo-modules-jsi` has the same setup for its own tests in `apple/Tests/Support/TestRuntimeScheduler.swift`:
/// it is a SwiftPM package and cannot depend on this pod. Keep the two in sync.
public final class JavaScriptTestThread: @unchecked Sendable {
  private let worker = Worker()
  private var appContext: AppContext?
  private var owningRuntime: JavaScriptRuntime?

  public init() {}

  deinit {
    // Tear down on the JavaScript thread, after any work that is still queued there, and in order:
    // the app context releases its runtime objects before the Hermes runtime they belong to goes
    // away. The operation also keeps the worker alive until then, as the runtime refers to it
    // unretained.
    let worker = self.worker
    let appContext = self.appContext
    let owningRuntime = self.owningRuntime
    worker.schedule {
      appContext?.destroy()
      _ = owningRuntime
      _ = worker
    }
    worker.stopWhenIdle()
  }

  /// Creates an app context whose runtime treats this thread as its JavaScript thread. Can be called
  /// once per thread.
  public func makeAppContext() async -> AppContext {
    precondition(appContext == nil, "JavaScriptTestThread already made an app context")
    let worker = self.worker
    let appContext = AppContext()
    // The runtime is created on the JavaScript thread: `JavaScriptRuntime` takes the thread it is
    // created on as its JavaScript thread, and setting the app context's runtime installs the core
    // object, which has to happen there as well.
    let owningRuntime = await worker.run {
      let owningRuntime = JavaScriptRuntime()
      owningRuntime.withUnsafePointee { runtimePointer in
        appContext.setRuntime(
          runtimePointer,
          scheduler: worker.opaquePointer,
          dispatch: unsafeBitCast(scheduleOnJavaScriptTestThread, to: UnsafeRawPointer.self)
        )
      }
      return owningRuntime
    }
    self.appContext = appContext
    self.owningRuntime = owningRuntime
    return appContext
  }
}

/// Runs the operations scheduled on it one at a time, in order, on a thread of its own. A serial
/// dispatch queue is not enough: it may use a different worker thread for each operation, while a
/// `JavaScriptRuntime` treats the thread it was created on as its JavaScript thread.
private final class Worker: @unchecked Sendable {
  private let condition = NSCondition()
  private var operations: [@convention(block) () -> Void] = []
  private var isStopping = false

  init() {
    let thread = Thread { [self] in
      runLoop()
    }
    thread.name = "expo.modules.tests.runtime"
    thread.start()
  }

  var opaquePointer: UnsafeMutableRawPointer {
    return Unmanaged.passUnretained(self).toOpaque()
  }

  func schedule(_ operation: @escaping @convention(block) () -> Void) {
    condition.lock()
    operations.append(operation)
    condition.signal()
    condition.unlock()
  }

  /// Makes the thread exit once it runs out of scheduled operations.
  func stopWhenIdle() {
    condition.lock()
    isStopping = true
    condition.signal()
    condition.unlock()
  }

  func run<R: Sendable>(_ operation: @escaping @Sendable () -> R) async -> R {
    return await withCheckedContinuation { continuation in
      schedule {
        continuation.resume(returning: operation())
      }
    }
  }

  private func runLoop() {
    while true {
      condition.lock()
      while operations.isEmpty && !isStopping {
        condition.wait()
      }
      if operations.isEmpty {
        condition.unlock()
        return
      }
      let operation = operations.removeFirst()
      condition.unlock()

      operation()
    }
  }
}

private let scheduleOnJavaScriptTestThread:
  @convention(c) (
    UnsafeMutableRawPointer?, Int32, @escaping @convention(block) () -> Void
  ) -> Void = { workerPointer, _, callback in
    guard let workerPointer else {
      return
    }
    let worker = Unmanaged<Worker>.fromOpaque(workerPointer).takeUnretainedValue()
    worker.schedule(callback)
  }
