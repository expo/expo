import ExpoModulesJSI
import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

/// Exercises a `JavaScriptRuntime` wired to a real `react::RuntimeScheduler` through the
/// dispatch trampoline, including the reload scenario where the React instance destroys
/// the scheduler while native code keeps scheduling through a retained runtime.
@Suite
@JavaScriptActor
struct ReactSchedulerDispatchIntegrationTests {
  /// Owns the Hermes runtime and keeps it alive for the whole test.
  let hermesRuntime: JavaScriptRuntime
  let testScheduler: EXTestReactScheduler
  /// Wraps the same Hermes runtime, but dispatches through the test scheduler.
  let runtime: JavaScriptRuntime

  init() {
    let hermesRuntime = JavaScriptRuntime()
    let testScheduler = EXTestReactScheduler()

    self.hermesRuntime = hermesRuntime
    self.testScheduler = testScheduler
    self.runtime = hermesRuntime.withUnsafePointee { runtimePointer in
      return JavaScriptRuntime(
        unsafePointer: runtimePointer,
        scheduler: testScheduler.schedulerHandle!,
        dispatch: testScheduler.dispatchFunction
      )
    }
  }

  @Test
  func `promise resolved through a live scheduler settles after draining`() throws {
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
    testScheduler.destroy()

    runtime.schedule(priority: .immediate) {
      Issue.record("The scheduled closure must not run after the scheduler teardown")
    }

    #expect(testScheduler.scheduledWorkLoopCount == 0)
    // The runtime itself remains fully usable.
    #expect(try runtime.eval("1 + 2").getInt() == 3)
  }
}
