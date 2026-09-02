import ExpoModulesJSI
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
  func `scheduling a closure after scheduler teardown is a safe no-op`() throws {
    let runtime = makeRuntimeWiredToTestScheduler()
    testScheduler.destroy()

    runtime.schedule(priority: .immediate) {
      Issue.record("The scheduled closure must not run after the scheduler teardown")
    }

    #expect(testScheduler.scheduledWorkLoopCount == 0)
    // The runtime itself remains fully usable.
    #expect(try runtime.eval("1 + 2").getInt() == 3)
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
