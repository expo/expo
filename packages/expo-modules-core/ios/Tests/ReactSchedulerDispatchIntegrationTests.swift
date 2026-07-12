import ExpoModulesJSI
import Foundation
import Testing

@testable import ExpoModulesCore

/// Exercises a `JavaScriptRuntime` wired to a real `react::RuntimeScheduler` through the
/// dispatch trampoline, including the reload scenario where the React instance destroys
/// the scheduler while native code keeps scheduling through a retained runtime.
@Suite
@JavaScriptActor
struct ReactSchedulerDispatchIntegrationTests {
  /// Owns the Hermes runtime; its `deinit` destroys the runtime, so it must outlive every
  /// wrapper created by `makeRuntimeWiredToTestScheduler()`.
  let hermesRuntime = JavaScriptRuntime()
  let testScheduler = EXTestReactScheduler()

  @Test
  func `promise resolved through a live scheduler settles after draining`() throws {
    let runtime = makeRuntimeWiredToTestScheduler()
    let promise = try JavaScriptPromise(runtime)
    runtime.global().setProperty("testPromise", value: promise.asValue())
    try runtime.eval("globalThis.testPromise.then(() => { globalThis.settled = true })")

    promise.resolve(42)
    #expect(testScheduler.scheduledWorkLoopCount == 1)

    hermesRuntime.withUnsafePointee { runtimePointer in
      testScheduler.drainWorkLoops(withRuntime: runtimePointer)
    }
    #expect(try runtime.eval("globalThis.settled === true").getBool())
  }

  @Test
  func `promise resolved after scheduler teardown is dropped without crashing`() throws {
    let runtime = makeRuntimeWiredToTestScheduler()
    let promise = try JavaScriptPromise(runtime)
    runtime.global().setProperty("testPromise", value: promise.asValue())
    try runtime.eval("globalThis.testPromise.then(() => { globalThis.settled = true })")

    // The React instance destroys the scheduler on teardown (e.g. reload) while native
    // code may still settle promises through a retained runtime.
    let workLoopCountBeforeTeardown = testScheduler.scheduledWorkLoopCount
    testScheduler.destroy()
    promise.resolve(42)

    #expect(testScheduler.scheduledWorkLoopCount == workLoopCountBeforeTeardown)
    // The runtime itself stays fully usable and the promise just never settles.
    #expect(try runtime.eval("globalThis.settled !== true").getBool())
  }

  @Test
  func `blocking execute rejects from an off-thread caller after scheduler teardown`() async {
    let runtime = makeRuntimeWiredToTestScheduler()
    testScheduler.destroy()

    await #expect(throws: JavaScriptRuntimeSchedulingError.self) {
      try await runOffThread {
        try runtime.execute { @JavaScriptActor in
          return 1
        }
      }
    }

    #expect(testScheduler.scheduledWorkLoopCount == 0)
  }

  @Test
  func `blocking async execute rejects from an off-thread caller after scheduler teardown`() async {
    let runtime = makeRuntimeWiredToTestScheduler()
    testScheduler.destroy()

    await #expect(throws: JavaScriptRuntimeSchedulingError.self) {
      try await runOffThread {
        try runtime.execute { @JavaScriptActor () async in
          return 1
        }
      }
    }

    #expect(testScheduler.scheduledWorkLoopCount == 0)
  }

  @Test
  func `async execute rejects from an off-thread caller after scheduler teardown`() async {
    let runtime = makeRuntimeWiredToTestScheduler()
    testScheduler.destroy()

    await #expect(throws: JavaScriptRuntimeSchedulingError.self) {
      try await runAsyncOffThread(runtime: runtime) {
        try await runtime.execute { @JavaScriptActor in
          return 1
        }
      }
    }

    #expect(testScheduler.scheduledWorkLoopCount == 0)
  }

  @Test
  func `async async execute rejects from an off-thread caller after scheduler teardown`() async {
    let runtime = makeRuntimeWiredToTestScheduler()
    testScheduler.destroy()

    await #expect(throws: JavaScriptRuntimeSchedulingError.self) {
      try await runAsyncOffThread(runtime: runtime) {
        try await runtime.execute { @JavaScriptActor () async in
          return 1
        }
      }
    }

    #expect(testScheduler.scheduledWorkLoopCount == 0)
  }

  /// Wraps the Hermes runtime in a non-owning `JavaScriptRuntime` that dispatches through
  /// the test scheduler's trampoline. Created per test as a local so it is destroyed at the
  /// end of the test body, strictly before the owning `hermesRuntime` stored property: the
  /// wrapper caches JSI objects that must be released while the runtime is still alive, and
  /// stored properties of the suite have no guaranteed relative teardown order.
  private func makeRuntimeWiredToTestScheduler() -> JavaScriptRuntime {
    return hermesRuntime.withUnsafePointee { runtimePointer in
      return JavaScriptRuntime(
        unsafePointer: runtimePointer,
        scheduler: testScheduler.schedulerHandle!,
        dispatch: testScheduler.dispatchFunction
      )
    }
  }
}

private final class SchedulerDispatchTestOperation<R: Sendable>: @unchecked Sendable {
  private var body: (@Sendable () throws -> R)?

  init(_ body: @escaping @Sendable () throws -> R) {
    self.body = body
  }

  func run() -> Result<R, any Error> {
    let body = body
    self.body = nil

    guard let body else {
      fatalError("Scheduler dispatch test operation ran more than once")
    }
    return Result { try body() }
  }
}

private final class SchedulerDispatchTestAsyncOperation<R: Sendable>: @unchecked Sendable {
  private var body: (@Sendable () async throws -> R)?
  private var isOnJavaScriptThread: (@Sendable () -> Bool)?

  init(runtime: JavaScriptRuntime, _ body: @escaping @Sendable () async throws -> R) {
    self.body = body
    self.isOnJavaScriptThread = { runtime.isOnJavaScriptThread() }
  }

  func run() async -> Result<R, any Error> {
    let body = body
    let isOnJavaScriptThread = isOnJavaScriptThread
    self.body = nil
    self.isOnJavaScriptThread = nil

    guard let body, let isOnJavaScriptThread else {
      fatalError("Scheduler dispatch test operation ran more than once")
    }
    do {
      guard !isOnJavaScriptThread() else {
        throw SchedulerDispatchTestExecutedOnJavaScriptThread()
      }
      return .success(try await body())
    } catch {
      return .failure(error)
    }
  }
}

private struct SchedulerDispatchTestExecutedOnJavaScriptThread: Error {}

private func runOffThread<R: Sendable>(
  _ body: @escaping @Sendable () throws -> R
) async throws -> R {
  return try await withCheckedThrowingContinuation { continuation in
    let operation = SchedulerDispatchTestOperation(body)
    Thread.detachNewThread {
      continuation.resume(with: operation.run())
    }
  }
}

private func runAsyncOffThread<R: Sendable>(
  runtime: JavaScriptRuntime,
  _ body: @escaping @Sendable () async throws -> R
) async throws -> R {
  return try await withCheckedThrowingContinuation { continuation in
    let operation = SchedulerDispatchTestAsyncOperation(runtime: runtime, body)
    Thread.detachNewThread {
      Task.immediate_polyfill {
        continuation.resume(with: await operation.run())
      }
    }
  }
}
