import ExpoModulesJSI
import Foundation
import Testing

/// Carries a single answer out of a host function back to the test body. Written on the runtime's
/// JavaScript thread and read after the `await()` that triggered the write has resumed, so the two
/// accesses are already ordered.
private final class ThreadFlag: @unchecked Sendable {
  var value: Bool?
}

/// A `JavaScriptEncodable` whose `encode` always throws, for exercising the encodable `resolve`'s
/// encode-failure path.
private struct FailingEncodable: JavaScriptEncodable {
  struct EncodingError: Error {}
  static func encode(_ value: FailingEncodable, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    throw EncodingError()
  }
}

/// Records whether `FlaggingEncodable` was encoded. Written on the JavaScript thread and read after the
/// test drained it.
private final class EncodeFlag: @unchecked Sendable {
  var isEncoded = false
}

/// A `JavaScriptEncodable` that records when it's encoded, which happens only when the work that settles
/// with it runs.
private struct FlaggingEncodable: JavaScriptEncodable {
  let flag: EncodeFlag

  static func encode(_ value: FlaggingEncodable, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    value.flag.isEncoded = true
    return .undefined()
  }
}

@Suite
@JavaScriptActor
struct JavaScriptPromiseTests {
  @Test
  func `create deferred promise`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)

    #expect(promise.isDeferred == true)
  }

  @Test
  func `deferred promises from separate runtimes settle independently`() async throws {
    let first = await TestRuntimeScheduler().makeRuntime()
    let second = await TestRuntimeScheduler().makeRuntime()
    let firstPromise = try await first.scheduler.runIsolated {
      UncheckedSendable(value: try JavaScriptPromise(first.runtime))
    }
    let secondPromise = try await second.scheduler.runIsolated {
      UncheckedSendable(value: try JavaScriptPromise(second.runtime))
    }
    firstPromise.value.resolve(1.0)
    secondPromise.value.resolve(2.0)
    #expect(try await firstPromise.value.await().getDouble() == 1.0)
    #expect(try await secondPromise.value.await().getDouble() == 2.0)
  }

  @Test
  func `creating many deferred promises reuses one runtime-level helper`() throws {
    let runtime = JavaScriptRuntime()
    for _ in 0..<1_000 {
      let promise = try JavaScriptPromise(runtime)
      promise.resolve(42.0)
    }
    // The only object the wrapper may leave on `globalThis` is the long-lived-objects anchor; a
    // per-promise helper leaking into the global scope would show up as extra own properties.
    let ownGlobals = try runtime.eval("Object.getOwnPropertyNames(globalThis).length").getInt()
    let freshGlobals = try JavaScriptRuntime().eval("Object.getOwnPropertyNames(globalThis).length").getInt()
    #expect(ownGlobals - freshGlobals <= 1)
  }

  @Test
  func `creating and settling a deferred promise installs no then handlers until awaited`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      try runtime.eval(
        """
        globalThis.thenCalls = 0;
        const originalThen = Promise.prototype.then;
        Promise.prototype.then = function (...args) {
          globalThis.thenCalls++;
          return originalThen.apply(this, args);
        };
        """
      )
      let promise = try JavaScriptPromise(runtime)
      promise.resolve(42.0)
      #expect(try runtime.eval("globalThis.thenCalls").getInt() == 0)
      let result = try await promise.await()
      #expect(result.getInt() == 42)
      #expect(try await runtime.execute { try runtime.eval("globalThis.thenCalls").getInt() } == 1)
    }
  }

  @Test
  func `awaiting a deferred promise that settled long before delivers the value`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise = try JavaScriptPromise(runtime)
      promise.resolve("late")
      // Let the engine run its reactions before anything is awaited.
      try runtime.drainMicrotasks()
      let result = try await promise.await().ref()
      #expect(try await runtime.execute { try result.take().getString() } == "late")
    }
  }

  @Test
  func `deferred promise construction throws when Promise constructor is unavailable`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.Promise = undefined")

    #expect(throws: Error.self) {
      _ = try JavaScriptPromise(runtime)
    }
  }

  @Test
  func `resolve promise with value`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise = try JavaScriptPromise(runtime)

      promise.resolve(JavaScriptValue(runtime, 42))

      let result = try await promise.await()
      #expect(result.getInt() == 42)
    }
  }

  @Test
  func `resolve with a both-conforming value keeps its representable type`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      // A 64-bit integer conforms to both `JavaScriptRepresentable` and `JavaScriptEncodable`. The
      // encodable overload is disfavored, so it resolves through the representable path and stays a JS
      // `number`, rather than encoding to a `bigint` (`Int64.encode`) or rejecting for exceeding the
      // safe-integer range (`Int.encode`).
      let promise = try JavaScriptPromise(runtime)
      promise.resolve(Int64(42))
      let result = try await promise.await()
      #expect(result.isNumber() == true)
      #expect(result.getInt() == 42)
    }
  }

  @Test
  func `resolve promise with an encodable-only value`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      // `Date` is `JavaScriptEncodable` but not `JavaScriptRepresentable`, so it can only settle the
      // promise through the encodable overload. It encodes to a JS `Date`.
      let promise = try JavaScriptPromise(runtime)
      let date = Date(timeIntervalSince1970: 1000)
      promise.resolve(date)
      let result = try await promise.await().ref()
      let milliseconds = try await runtime.execute {
        try result.take().getObject().callFunction("getTime").asDouble()
      }
      #expect(milliseconds == 1_000_000)
    }
  }

  @Test
  func `resolve rejects the promise when encoding throws`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      // The encodable `resolve` encodes on the JavaScript thread; if that throws, the promise must
      // reject with the thrown error rather than fulfill.
      let promise = try JavaScriptPromise(runtime)
      promise.resolve(FailingEncodable())
      await #expect(throws: Error.self) {
        _ = try await promise.await()
      }
    }
  }

  @Test
  func `resolve promise with string`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise = try JavaScriptPromise(runtime)

      promise.resolve(JavaScriptValue(runtime, "hello"))

      let result = try await promise.await().ref()
      #expect(try await runtime.execute { try result.take().getString() } == "hello")
    }
  }

  @Test
  func `resolve promise with object`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise = try JavaScriptPromise(runtime)

      let obj = runtime.createObject()
      obj.setProperty("value", value: 42)
      promise.resolve(obj.asValue())

      let result = try await promise.await().ref()
      let value = try await runtime.execute {
        try result.take().getObject().getProperty("value").getInt()
      }
      #expect(value == 42)
    }
  }

  @Test
  func `awaiting a settled promise again delivers the value again`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise = try JavaScriptPromise(runtime)

      let obj = runtime.createObject()
      obj.setProperty("value", value: 42)
      promise.resolve(obj.asValue())

      let firstRef = try await promise.await().ref()
      let secondRef = try await promise.await().ref()
      try await runtime.execute {
        let first: JavaScriptValue = try firstRef.take()
        let second: JavaScriptValue = try secondRef.take()
        #expect(first.getObject().getProperty("value").getInt() == 42)
        #expect(second.getObject().getProperty("value").getInt() == 42)
        // Both reads clone the same settled object.
        let isSameObject = first.isEqual(to: second)
        #expect(isSameObject)
      }
    }
  }

  @Test
  func `reject promise with error`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise = try JavaScriptPromise(runtime)

      struct TestError: Error {
        var localizedDescription: String { "Test error message" }
      }

      promise.reject(TestError())

      await #expect(throws: Error.self) {
        _ = try await promise.await()
      }
    }
  }

  @Test
  func `wrap existing resolved promise`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let resolvedPromise = try runtime.eval("Promise.resolve(42)").getPromise()
      let result = try await resolvedPromise.await()

      #expect(result.getInt() == 42)
    }
  }

  @Test
  func `wrap existing rejected promise`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let rejectedPromise = try runtime.eval("Promise.reject(new Error('test error'))").getPromise()

      await #expect(throws: Error.self) {
        _ = try await rejectedPromise.await()
      }
    }
  }

  @Test
  func `wrapped promise setup throws when then is unavailable`() throws {
    let runtime = JavaScriptRuntime()
    let promiseValue = try runtime.eval(
      """
      const promise = Promise.resolve(42);
      promise.then = undefined;
      promise;
      """
    )

    #expect(throws: Error.self) {
      _ = try promiseValue.getPromise()
    }
    // A failed initializer must not leave its state registered, or it would pin the promise object
    // in the collection until teardown even though no `JavaScriptPromise` escaped.
    #expect(runtime.longLivedObjects.count == 0)
  }

  @Test
  func `wrap pending promise that resolves later`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let pendingPromise =
        try runtime
        .eval("new Promise((resolve) => { Promise.resolve().then(() => resolve(100)) })")
        .getPromise()
      let result = try await pendingPromise.await()

      #expect(result.getInt() == 100)
    }
  }

  @Test
  func `asValue returns promise object`() throws {
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)
    let value = promise.asValue()

    #expect(value.isObject() == true)
  }

  @Test
  func `promise can be passed to JavaScript`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise = try JavaScriptPromise(runtime)

      runtime.global().setProperty("testPromise", value: promise.asValue())
      promise.resolve(42)

      let result = try await runtime.eval("globalThis.testPromise").getPromise().await()

      #expect(result.getInt() == 42)
    }
  }

  @Test
  func `promise can be chained in JavaScript`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise = try JavaScriptPromise(runtime)

      runtime.global().setProperty("testPromise", value: promise.asValue())

      // Chain the promise in JavaScript
      let chainedPromise = try runtime.eval("globalThis.testPromise.then(x => x * 2)").getPromise()

      // Resolve the original promise
      promise.resolve(21)

      // Verify the chained promise
      let result = try await chainedPromise.await()
      #expect(result.getInt() == 42)
    }
  }

  @Test
  func `resolve with boolean`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise = try JavaScriptPromise(runtime)

      promise.resolve(JavaScriptValue(runtime, true))

      let result = try await promise.await()
      #expect(result.getBool() == true)
    }
  }

  @Test
  func `resolve with null`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise = try JavaScriptPromise(runtime)

      promise.resolve(JavaScriptValue.null())

      let result = try await promise.await()
      #expect(result.isNull() == true)
    }
  }

  @Test
  func `resolve with undefined`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise = try JavaScriptPromise(runtime)

      promise.resolve(JavaScriptValue.undefined())

      let result = try await promise.await()
      #expect(result.isUndefined() == true)
    }
  }

  @Test
  func `resolve with array`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise = try JavaScriptPromise(runtime)

      promise.resolve([1, 2, 3])

      let value = try await promise.await().ref()

      try await runtime.execute {
        let result = try value.take().getArray()
        #expect(result.length == 3)
        #expect(result[0].getInt() == 1)
        #expect(result[1].getInt() == 2)
        #expect(result[2].getInt() == 3)
      }
    }
  }

  @Test
  func `multiple promises resolve independently`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise1 = try JavaScriptPromise(runtime)
      let promise2 = try JavaScriptPromise(runtime)

      promise1.resolve(10)
      promise2.resolve(20)

      let result1 = try await promise1.await()
      let result2 = try await promise2.await()

      #expect(result1.getInt() == 10)
      #expect(result2.getInt() == 20)
    }
  }

  @Test
  func `promise from async JavaScript function`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let result =
        try await runtime
        .eval("(async function() { return 42; })")
        .getFunction()
        .call()
        .getPromise()
        .await()

      #expect(result.getInt() == 42)
    }
  }

  @Test
  func `promise from async JavaScript function with arguments`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let result =
        try await runtime
        .eval("(async function(a, b) { return a + b; })")
        .getFunction()
        .call(arguments: 15, 27)
        .getPromise()
        .await()

      #expect(result.getInt() == 42)
    }
  }

  @Test
  func `promise catches JavaScript errors`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise =
        try runtime
        .eval("(async function() { throw new Error('async error'); })")
        .getFunction()
        .call()
        .getPromise()

      await #expect(throws: Error.self) {
        _ = try await promise.await()
      }
    }
  }

  @Test
  func `resolve promise from a task`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise = try JavaScriptPromise(runtime)

      // Resolve from a task
      Task.detached {
        try await Task.sleep(nanoseconds: 10_000_000) // 10ms
        promise.resolve(99)
      }

      let result = try await promise.await()
      #expect(result.getInt() == 99)
    }
  }

  @Test
  func `reject promise from a task while awaiting`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise = try JavaScriptPromise(runtime)

      struct TestError: Error {}

      // Reject after the await has already suspended on the pending promise. This must throw, not
      // resume the awaiting caller with the rejection value as if it were fulfilled.
      Task.detached {
        try await Task.sleep(nanoseconds: 10_000_000) // 10ms
        promise.reject(TestError())
      }

      await #expect(throws: Error.self) {
        _ = try await promise.await()
      }
    }
  }

  @Test
  func `awaiting off the JavaScript thread installs the then callbacks on it`() async throws {
    let testRuntime = await TestRuntimeScheduler().makeRuntime()
    let installedOnJavaScriptThread = ThreadFlag()

    let promise = try await testRuntime.scheduler.runIsolated {
      let runtime = testRuntime.runtime
      // A thenable whose `then` records where the engine called it from, then fulfills right away
      // so the `await()` below completes and the recorded answer can be read.
      let thenable = runtime.createObject()
      let then = runtime.createFunction("then") { _, arguments in
        installedOnJavaScriptThread.value = runtime.isOnJavaScriptThread()
        return try arguments[0].getFunction().call(arguments: 42)
      }
      thenable.setProperty("then", value: then.asValue())
      return UncheckedSendable(value: try JavaScriptPromise(runtime, thenable))
    }

    // The test body runs on the cooperative pool, never on the runtime's dedicated thread, so this
    // `await()` is the off-thread case. Installing the callbacks calls `then`, which is JavaScript,
    // and JavaScript for this runtime may only run on the thread that owns it.
    #expect(testRuntime.runtime.isOnJavaScriptThread() == false)

    let result = try await promise.value.await()

    #expect(result.getInt() == 42)
    #expect(installedOnJavaScriptThread.value == true)
  }

  @Test
  func `settling promise more than once is ignored`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      struct TestError: Error, Sendable {}

      let promise = try JavaScriptPromise(runtime)

      runtime.global().setProperty("testPromise", value: promise.asValue())
      promise.resolve(42)
      promise.reject(TestError())
      promise.resolve(100)

      let result = try await promise.await()

      #expect(result.getInt() == 42)
    }
  }

  @Test
  func `promise all`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise1 = try JavaScriptPromise(runtime)
      let promise2 = try JavaScriptPromise(runtime)
      let promise3 = try JavaScriptPromise(runtime)

      runtime.global().setProperty("p1", value: promise1.asValue())
      runtime.global().setProperty("p2", value: promise2.asValue())
      runtime.global().setProperty("p3", value: promise3.asValue())

      let promiseAll =
        try runtime
        .eval("Promise.all([globalThis.p1, globalThis.p2, globalThis.p3])")
        .getPromise()

      promise1.resolve(JavaScriptValue(runtime, 1))
      promise2.resolve(JavaScriptValue(runtime, 2))
      promise3.resolve(JavaScriptValue(runtime, 3))

      let value = try await promiseAll.await().ref()

      try await runtime.execute {
        let array = try value.take().getArray()
        #expect(array.length == 3)
        #expect(try array.getValue(at: 0).getInt() == 1)
        #expect(try array.getValue(at: 1).getInt() == 2)
        #expect(try array.getValue(at: 2).getInt() == 3)
      }
    }
  }

  @Test
  func `promise race`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise1 = try JavaScriptPromise(runtime)
      let promise2 = try JavaScriptPromise(runtime)

      runtime.global().setProperty("p1", value: promise1.asValue())
      runtime.global().setProperty("p2", value: promise2.asValue())

      let promiseRace = try runtime.eval("Promise.race([globalThis.p1, globalThis.p2])").getPromise()

      // Resolve promise1 first
      promise1.resolve(JavaScriptValue(runtime, 42))

      let firstResult = try await promiseRace.await()
      #expect(firstResult.getInt() == 42)
    }
  }

  @Test
  func `wrapped promise is marked as deferred`() throws {
    let runtime = JavaScriptRuntime()
    let promise = try runtime.eval("Promise.resolve(42)").getPromise()

    #expect(promise.isDeferred == false)
  }

  // MARK: - Long-lived object registration

  @Test
  func `deferred promise registers as a long-lived object`() throws {
    let runtime = JavaScriptRuntime()
    #expect(runtime.longLivedObjects.count == 0)

    let promise = try JavaScriptPromise(runtime)
    _ = promise.isDeferred

    #expect(runtime.longLivedObjects.count == 1)
  }

  @Test
  func `wrapping an existing promise registers to own its object`() throws {
    let runtime = JavaScriptRuntime()
    let promise = try runtime.eval("Promise.resolve(42)").getPromise()
    #expect(promise.isDeferred == false)

    // Even a wrapped promise owns a JSI object that must not be released against a freed runtime,
    // so it registers to have that object swept at teardown.
    #expect(runtime.longLivedObjects.count == 1)
  }

  @Test
  func `settling keeps the promise registered while the wrapper is alive`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let promise = try JavaScriptPromise(runtime)
      #expect(runtime.longLivedObjects.count == 1)

      promise.resolve(JavaScriptValue(runtime, 42))
      _ = try await promise.await()

      // Settling releases the resolve/reject functions, but the state stays registered so it continues
      // to own the promise object for as long as the wrapper is alive (it is only deregistered when the
      // wrapper is dropped, see the tests below, or by the teardown sweep).
      #expect(promise.isDeferred == false)
      #expect(try await runtime.execute { runtime.longLivedObjects.count } == 1)
    }
  }

  @Test
  func `dropping a settled promise deregisters its state`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      do {
        let promise = try JavaScriptPromise(runtime)
        promise.resolve(JavaScriptValue(runtime, 42))
        _ = try await promise.await()
        #expect(try await runtime.execute { runtime.longLivedObjects.count } == 1)
        // Leaving the scope drops the last owner of the wrapper.
      }

      // Dropping the wrapper deregisters its state and releases the promise object, so a stream of
      // short-lived promises doesn't pin their objects (and resolution values) until teardown.
      #expect(try await runtime.execute { runtime.longLivedObjects.count } == 0)
    }
  }

  @Test
  func `dropping an unsettled promise deregisters its state`() throws {
    let runtime = JavaScriptRuntime()

    do {
      let promise = try JavaScriptPromise(runtime)
      #expect(promise.isDeferred == true)
      #expect(runtime.longLivedObjects.count == 1)
      // The promise is never settled; dropping the wrapper here is the only owner going away.
    }

    // Even an unsettled promise releases its state when its wrapper is dropped: nothing outside can
    // settle it anymore, so keeping it registered would only pin the object until teardown.
    #expect(runtime.longLivedObjects.count == 0)
  }

  @Test
  func `dropping a wrapped promise deregisters its state`() throws {
    let runtime = JavaScriptRuntime()

    do {
      let promise = try runtime.eval("Promise.resolve(42)").getPromise()
      #expect(promise.isDeferred == false)
      #expect(runtime.longLivedObjects.count == 1)
    }

    #expect(runtime.longLivedObjects.count == 0)
  }

  @Test
  func `an unsettled deferred promise is released by the teardown sweep`() throws {
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)
    #expect(runtime.longLivedObjects.count == 1)

    // The promise is never settled; the runtime's teardown sweep must release its long-lived state.
    runtime.longLivedObjects.clear()

    #expect(runtime.longLivedObjects.count == 0)
    // After the sweep the settle functions are released, so it can no longer be settled.
    #expect(promise.isDeferred == false)
  }

  @Test
  func `an unsettled deferred promise outliving its runtime does not crash on teardown`() throws {
    // Reproduces the shape of the promise-teardown crash (#47454): a deferred promise is still in
    // flight when its runtime is torn down. Before the state was owned by the runtime's
    // `LongLivedObjectCollection`, its JSI values were released after the Hermes runtime was already
    // destroyed, a use-after-free. Now the runtime's teardown sweep releases the state on the JS
    // thread while the runtime is still valid.
    var promise: JavaScriptPromise? = nil

    do {
      let runtime = JavaScriptRuntime()
      promise = try JavaScriptPromise(runtime)
      #expect(promise?.isDeferred == true)
      // Leaving the scope releases the runtime while the promise is still unsettled. Its teardown
      // sweep must release the promise's state before Hermes is destroyed.
    }

    // Dropping the promise wrapper here must not touch a freed runtime. This is the crash point in
    // #47454; reaching the end of the test without a crash is the assertion.
    promise = nil
  }

  @Test(.timeLimit(.minutes(1)))
  func `awaiting a promise whose runtime is gone throws RuntimeLostError`() async throws {
    var promise: JavaScriptPromise? = nil
    do {
      let runtime = JavaScriptRuntime()
      promise = try JavaScriptPromise(runtime)
    }
    await #expect(throws: JavaScriptCallback.RuntimeLostError.self) {
      _ = try await promise?.await()
    }
    promise = nil
  }

  @Test
  func `a resolve queued before the runtime goes away is dropped`() async throws {
    let testRuntime = await ReleasableTestRuntime()
    let promise = try await testRuntime.scheduler.runIsolated {
      UncheckedSendable(value: try JavaScriptPromise(testRuntime.runtime!))
    }
    let flag = EncodeFlag()

    await testRuntime.releaseRuntime(afterQueueing: {
      promise.value.resolve(FlaggingEncodable(flag: flag))
    })

    #expect(flag.isEncoded == false)
    await testRuntime.tearDown()
  }

  @Test
  func `the teardown sweep releases the value of an awaited promise`() async throws {
    // The receiver keeps the settled value so a later `await()` can read it again. It must not keep
    // it past the runtime's teardown sweep: a value destroyed after its runtime is a use-after-free.
    // The runtime work stays on the scheduler's thread, which owns the runtime.
    let testRuntime = await TestRuntimeScheduler().makeRuntime()
    let (promise, weakObject) = try await testRuntime.scheduler.runIsolated {
      let runtime = testRuntime.runtime
      let promise = try JavaScriptPromise(runtime)
      let object = runtime.createObject()
      let weakObject = object.createWeak()
      promise.resolve(object.asValue())
      return (UncheckedSendable(value: promise), UncheckedSendable(value: weakObject))
    }
    // Moved into a ref, so the awaited value is released on the runtime's thread below.
    let awaited = try await promise.value.await().ref()

    let isCollected = try await testRuntime.scheduler.runIsolated {
      let runtime = testRuntime.runtime
      awaited.release()
      runtime.longLivedObjects.clear()
      let isCollected = { weakObject.value.lock() == nil }
      runtime.collectGarbage(until: isCollected)
      return isCollected()
    }
    #expect(isCollected)
  }

  @Test
  func `awaiting a thenable that fulfills with zero arguments returns undefined`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let thenable = try runtime.eval("({ then(resolve) { resolve(); } })").getObject()
      let promise = try JavaScriptPromise(runtime, thenable)
      let result = try await promise.await()
      #expect(result.isUndefined() == true)
    }
  }

  @Test
  func `awaiting a thenable that rejects with zero arguments throws`() async throws {
    try await TestRuntimeScheduler().makeRuntime().run { runtime in
      let thenable = try runtime.eval("({ then(_, reject) { reject(); } })").getObject()
      let promise = try JavaScriptPromise(runtime, thenable)
      await #expect(throws: JavaScriptError.self) {
        _ = try await promise.await()
      }
    }
  }

  @Test
  func `awaiting a pending promise concurrently delivers the value to all callers`() async throws {
    let testRuntime = await TestRuntimeScheduler().makeRuntime()
    let thenInstalled = DispatchSemaphore(value: 0)
    let thenCallCount = ThreadCounter()
    let (promise, resolveFn) = try await testRuntime.scheduler.runIsolated {
      let runtime = testRuntime.runtime
      try runtime.eval(
        """
        globalThis.pendingObj = { value: 42 };
        globalThis.rawPromise = new Promise((resolve) => {
          globalThis.resolvePending = () => resolve(globalThis.pendingObj);
        });
        """
      )
      let rawPromise = try runtime.global().getPropertyAsObject("rawPromise")
      let originalThen = try rawPromise.getPropertyAsFunction("then").ref()
      let wrappedThen = runtime.createFunction("then") { this, arguments in
        thenCallCount.increment()
        defer { thenInstalled.signal() }
        let fn = originalThen.withUnwrappedValue { $0.asValue().getFunction() }!
        return try fn.call(this: this.getObject(), arguments: arguments)
      }
      rawPromise.setProperty("then", value: wrappedThen.asValue())
      let promise = try JavaScriptPromise(runtime, rawPromise)
      let resolveFn = try runtime.global().getPropertyAsFunction("resolvePending").ref()
      return (UncheckedSendable(value: promise), resolveFn)
    }

    let first = Task {
      try await promise.value.await().ref()
    }
    let second = Task {
      try await promise.value.await().ref()
    }

    // Wait until `then` has been installed and both tasks have had a chance to queue their `await`.
    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      DispatchQueue.global().async {
        thenInstalled.wait()
        continuation.resume()
      }
    }
    try await testRuntime.scheduler.runIsolated {
      _ = try resolveFn.take().call()
    }

    let firstRef = try await first.value
    let secondRef = try await second.value
    try await testRuntime.scheduler.runIsolated {
      let firstVal: JavaScriptValue = try firstRef.take()
      let secondVal: JavaScriptValue = try secondRef.take()
      #expect(firstVal.getObject().getProperty("value").getInt() == 42)
      #expect(secondVal.getObject().getProperty("value").getInt() == 42)
      let isSameObject = firstVal.isEqual(to: secondVal)
      #expect(isSameObject)
    }
    #expect(thenCallCount.value == 1)
  }

  @Test
  func `awaiting a pending promise concurrently propagates rejection to all callers`() async throws {
    let testRuntime = await TestRuntimeScheduler().makeRuntime()
    let promise = try await testRuntime.scheduler.runIsolated {
      UncheckedSendable(value: try JavaScriptPromise(testRuntime.runtime))
    }

    struct ConcurrentRejectionError: Error {}

    let first = Task {
      try await promise.value.await().ref()
    }
    let second = Task {
      try await promise.value.await().ref()
    }

    // Give both tasks a turn on the JS thread before rejecting.
    await testRuntime.scheduler.run {}
    await testRuntime.scheduler.run {}
    promise.value.reject(ConcurrentRejectionError())

    await #expect(throws: Error.self) {
      _ = try await first.value
    }
    await #expect(throws: Error.self) {
      _ = try await second.value
    }
  }

  @Test(.timeLimit(.minutes(1)))
  func `tearing down the runtime while awaiting a pending promise throws RuntimeLostError`() async throws {
    let testRuntime = await ReleasableTestRuntime()
    let thenInstalled = DispatchSemaphore(value: 0)
    let promise = try await testRuntime.scheduler.runIsolated {
      let runtime = testRuntime.runtime!
      let thenable = runtime.createObject()
      let then = runtime.createFunction("then") { _, _ in
        thenInstalled.signal()
        return .undefined()
      }
      thenable.setProperty("then", value: then.asValue())
      return UncheckedSendable(value: try JavaScriptPromise(runtime, thenable))
    }

    let awaiting = Task {
      try await promise.value.await().ref()
    }

    await withCheckedContinuation { (continuation: CheckedContinuation<Void, Never>) in
      DispatchQueue.global().async {
        thenInstalled.wait()
        continuation.resume()
      }
    }
    await testRuntime.tearDown()

    await #expect(throws: JavaScriptCallback.RuntimeLostError.self) {
      _ = try await awaiting.value
    }
  }

  @Test
  func `resolve with JavaScriptValue releases value on teardown if task is dropped`() async throws {
    let testRuntime = await ReleasableTestRuntime(dispatch: holdPromiseSchedulerTask)
    defer {
      heldPromiseSchedulerTasks.removeAll()
    }
    let (promise, isCollected) = try await testRuntime.scheduler.runIsolated {
      let runtime = testRuntime.runtime!
      let promise = try JavaScriptPromise(runtime)
      let weakObject: JavaScriptWeakObject
      do {
        let object = runtime.createObject()
        weakObject = object.createWeak()
        // Queued on the holding dispatch, so the settle closure stays alive without running.
        promise.resolve(object.asValue())
      }
      runtime.longLivedObjects.clear()
      let isCollected = { weakObject.lock() == nil }
      runtime.collectGarbage(until: isCollected)
      return (UncheckedSendable(value: promise), isCollected())
    }
    #expect(isCollected)
    await testRuntime.tearDown()
    // Dropping the held closure after the runtime is gone must not touch a freed runtime.
    heldPromiseSchedulerTasks.removeAll()
    withExtendedLifetime(promise) {}
  }
}

private final class ThreadCounter: @unchecked Sendable {
  private let lock = NSLock()
  private var count = 0

  var value: Int {
    lock.withLock { count }
  }

  func increment() {
    lock.withLock { count += 1 }
  }
}

nonisolated(unsafe) private var heldPromiseSchedulerTasks: [() -> Void] = []

private let holdPromiseSchedulerTask:
  @convention(c) (
    UnsafeMutableRawPointer?, Int32, @escaping @convention(block) () -> Void
  ) -> Void = { _, _, callback in
    heldPromiseSchedulerTasks.append(callback)
  }
