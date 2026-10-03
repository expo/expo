// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation

/// An `AppContext` whose runtime has a JavaScript thread of its own, for module tests that await an
/// async function whose body suspends.
///
/// The runtime of `AppContext.create()` has no JavaScript thread: it runs scheduled work inline on
/// whatever thread calls `schedule`, and the `JavaScriptActor` executor runs jobs inline too. Once
/// an async function body resumes on a cooperative thread, it settles its promise from there,
/// concurrently with the test body that is still evaluating JavaScript on the same runtime. Hermes
/// does not survive that. Here the runtime dispatches its scheduled work to a dedicated thread, and
/// ``run(_:)`` and ``evalAsync(_:_:)`` run the test's own JavaScript work there too, so the two are
/// serialized.
///
/// `expo-modules-jsi` has the same setup for its own tests in `apple/Tests/Support/TestRuntimeScheduler.swift`:
/// it is a SwiftPM package and cannot depend on this pod. Keep the two in sync.
public final class TestAppContext: @unchecked Sendable {
  /// The app context. Register modules on it before calling into JavaScript.
  public let appContext: AppContext

  private let thread: JavaScriptTestThread

  /// Owns the Hermes runtime. The app context's runtime only wraps it, so this has to outlive the
  /// app context's runtime, and both are released on the JavaScript thread in `deinit`.
  private let owningRuntime: JavaScriptRuntime

  public init() async {
    let thread = JavaScriptTestThread()
    let appContext = AppContext()
    // The runtime is created on the JavaScript thread: `JavaScriptRuntime` takes the thread it is
    // created on as its JavaScript thread, and setting the app context's runtime installs the core
    // object, which has to happen there as well.
    let owningRuntime = await thread.run {
      let owningRuntime = JavaScriptRuntime()
      owningRuntime.withUnsafePointee { runtimePointer in
        appContext.setRuntime(
          runtimePointer,
          scheduler: thread.opaquePointer,
          dispatch: unsafeBitCast(scheduleOnJavaScriptTestThread, to: UnsafeRawPointer.self)
        )
      }
      return owningRuntime
    }
    self.thread = thread
    self.appContext = appContext
    self.owningRuntime = owningRuntime
  }

  deinit {
    // Tear down on the JavaScript thread, after any work that is still queued there, and in order:
    // the app context releases its runtime objects before the Hermes runtime they belong to goes away.
    let thread = self.thread
    let appContext = self.appContext
    let owningRuntime = self.owningRuntime
    // The operation also keeps the thread alive until then: the runtime refers to it unretained.
    thread.schedule {
      appContext.destroy()
      _ = owningRuntime
      _ = thread
    }
    thread.stopWhenIdle()
  }

  /// The app context's runtime.
  public var runtime: ExpoRuntime {
    get throws {
      return try appContext.runtime
    }
  }

  /// Runs the operation on the JavaScript thread.
  public func run<R: Sendable>(
    _ operation: @escaping @Sendable @JavaScriptActor (_ runtime: ExpoRuntime) throws -> R
  ) async throws -> R {
    let runtime = try self.runtime
    return try await thread.runThrowing {
      try JavaScriptActor.assumeIsolated {
        try operation(runtime)
      }
    }
  }

  /// Evaluates the source on the JavaScript thread, awaits the promise it returns (if any), and passes
  /// the settled value to `transform`, also on the JavaScript thread. The value is valid only within
  /// `transform`: return something `Sendable` read from it, such as a string.
  public func evalAsync<R: Sendable>(
    _ source: String,
    _ transform: @escaping @Sendable @JavaScriptActor (_ value: JavaScriptValue) throws -> R
  ) async throws -> R {
    let runtime = try self.runtime
    let settled: SettledValue = try await thread.runAsync {
      return SettledValue(try await runtime.evalAsync(source))
    }
    // `evalAsync` resumes on whatever thread settled the promise, so read the value back on the
    // JavaScript thread. It is also released there, rather than on the thread that runs this.
    return try await thread.runThrowing {
      try JavaScriptActor.assumeIsolated {
        try transform(settled.take())
      }
    }
  }
}

/// Carries a settled value from the thread that settled the promise to the JavaScript thread.
/// Sound because the value is only read and released on the JavaScript thread, after the runtime is
/// done settling it.
private final class SettledValue: @unchecked Sendable {
  private var value: JavaScriptValue?

  init(_ value: JavaScriptValue) {
    self.value = value
  }

  func take() -> JavaScriptValue {
    defer {
      value = nil
    }
    return value!
  }
}

/// A thread that runs the operations scheduled on it one at a time, in order. A serial dispatch
/// queue is not enough: it may use a different worker thread for each operation, while a
/// `JavaScriptRuntime` treats the thread it was created on as its JavaScript thread.
private final class JavaScriptTestThread: @unchecked Sendable {
  private let state = State()

  init() {
    let state = self.state
    let thread = Thread {
      state.run()
    }
    thread.name = "expo.modules.tests.runtime"
    thread.start()
  }

  var opaquePointer: UnsafeMutableRawPointer {
    return Unmanaged.passUnretained(self).toOpaque()
  }

  func schedule(_ operation: @escaping @convention(block) () -> Void) {
    state.schedule(operation)
  }

  /// Makes the thread exit once it runs out of scheduled operations.
  func stopWhenIdle() {
    state.stopWhenIdle()
  }

  func runThrowing<R: Sendable>(_ operation: @escaping @Sendable () throws -> R) async throws -> R {
    return try await withCheckedThrowingContinuation { continuation in
      schedule {
        continuation.resume(with: Result { try operation() })
      }
    }
  }

  func run<R: Sendable>(_ operation: @escaping @Sendable () -> R) async -> R {
    return await withCheckedContinuation { continuation in
      schedule {
        continuation.resume(returning: operation())
      }
    }
  }

  /// Starts the operation on this thread. It runs here up to its first suspension; after that it
  /// resumes wherever the work it awaited completes.
  func runAsync<R: Sendable>(
    _ operation: @escaping @Sendable @JavaScriptActor () async throws -> R
  ) async throws -> R {
    return try await withCheckedThrowingContinuation { continuation in
      schedule {
        Task.immediate_polyfill { @JavaScriptActor in
          do {
            continuation.resume(returning: try await operation())
          } catch {
            continuation.resume(throwing: error)
          }
        }
      }
    }
  }

  private final class State: @unchecked Sendable {
    private let condition = NSCondition()
    private var operations: [@convention(block) () -> Void] = []
    private var isStopping = false

    func schedule(_ operation: @escaping @convention(block) () -> Void) {
      condition.lock()
      operations.append(operation)
      condition.signal()
      condition.unlock()
    }

    func stopWhenIdle() {
      condition.lock()
      isStopping = true
      condition.signal()
      condition.unlock()
    }

    func run() {
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
}

private let scheduleOnJavaScriptTestThread:
  @convention(c) (
    UnsafeMutableRawPointer?, Int32, @escaping @convention(block) () -> Void
  ) -> Void = { threadPointer, _, callback in
    guard let threadPointer else {
      return
    }
    let thread = Unmanaged<JavaScriptTestThread>.fromOpaque(threadPointer).takeUnretainedValue()
    thread.schedule(callback)
  }
