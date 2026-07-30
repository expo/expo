import ExpoModulesJSI
import Foundation
import Testing

/// A `JavaScriptEncodable` whose `encode` always throws, for exercising the encodable `resolve`'s
/// encode-failure path.
private struct FailingEncodable: JavaScriptEncodable {
  struct EncodingError: Error {}
  static func encode(_ value: FailingEncodable, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    throw EncodingError()
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
  func `deferred promise construction throws when Promise constructor is unavailable`() throws {
    let runtime = JavaScriptRuntime()
    try runtime.eval("globalThis.Promise = undefined")

    #expect(throws: Error.self) {
      _ = try JavaScriptPromise(runtime)
    }
  }

  @Test
  func `resolve promise with value`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)

    promise.resolve(JavaScriptValue(runtime, 42))

    let result = try await promise.await()
    #expect(result.getInt() == 42)
  }

  @Test
  func `resolve with a both-conforming value keeps its representable type`() async throws {
    // A 64-bit integer conforms to both `JavaScriptRepresentable` and `JavaScriptEncodable`. The
    // encodable overload is disfavored, so it resolves through the representable path and stays a JS
    // `number`, rather than encoding to a `bigint` (`Int64.encode`) or rejecting for exceeding the
    // safe-integer range (`Int.encode`).
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)
    promise.resolve(Int64(42))
    let result = try await promise.await()
    #expect(result.isNumber())
    #expect(result.getInt() == 42)
  }

  @Test
  func `resolve promise with an encodable-only value`() async throws {
    // `Date` is `JavaScriptEncodable` but not `JavaScriptRepresentable`, so it can only settle the
    // promise through the encodable overload. It encodes to a JS `Date`.
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)
    let date = Date(timeIntervalSince1970: 1000)
    promise.resolve(date)
    let result = try await promise.await()
    let milliseconds = try result.getObject().callFunction("getTime").asDouble()
    #expect(milliseconds == 1_000_000)
  }

  @Test
  func `resolve rejects the promise when encoding throws`() async throws {
    // The encodable `resolve` encodes on the JavaScript thread; if that throws, the promise must
    // reject with the thrown error rather than fulfill.
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)
    promise.resolve(FailingEncodable())
    await #expect(throws: Error.self) {
      try await promise.await()
    }
  }

  @Test
  func `resolve promise with string`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)

    promise.resolve(JavaScriptValue(runtime, "hello"))

    let result = try await promise.await()
    #expect(result.getString() == "hello")
  }

  @Test
  func `resolve promise with object`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)

    let obj = runtime.createObject()
    obj.setProperty("value", value: 42)
    promise.resolve(obj.asValue())

    let result = try await promise.await()
    #expect(result.isObject())
    #expect(result.getObject().getProperty("value").getInt() == 42)
  }

  @Test
  func `reject promise with error`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)

    struct TestError: Error {
      var localizedDescription: String { "Test error message" }
    }

    promise.reject(TestError())

    await #expect(throws: Error.self) {
      try await promise.await()
    }
  }

  @Test
  func `wrap existing resolved promise`() async throws {
    let runtime = JavaScriptRuntime()
    let resolvedPromise = try runtime.eval("Promise.resolve(42)").getPromise()
    let result = try await resolvedPromise.await()

    #expect(result.getInt() == 42)
  }

  @Test
  func `wrap existing rejected promise`() async throws {
    let runtime = JavaScriptRuntime()
    let rejectedPromise = try runtime.eval("Promise.reject(new Error('test error'))").getPromise()

    await #expect(throws: Error.self) {
      try await rejectedPromise.await()
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
      """)

    #expect(throws: Error.self) {
      _ = try promiseValue.getPromise()
    }
    // A failed initializer must not leave its state registered, or it would pin the promise object
    // in the collection until teardown even though no `JavaScriptPromise` escaped.
    #expect(runtime.longLivedObjects.count == 0)
  }

  @Test
  func `wrap pending promise that resolves later`() async throws {
    let runtime = JavaScriptRuntime()
    let pendingPromise = try runtime.eval("new Promise((resolve) => { setImmediate(() => resolve(100)) })").getPromise()
    let result = try await pendingPromise.await()

    #expect(result.getInt() == 100)
  }

  @Test
  func `asValue returns promise object`() throws {
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)
    let value = promise.asValue()

    #expect(value.isObject())
  }

  @Test
  func `promise can be passed to JavaScript`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)

    runtime.global().setProperty("testPromise", value: promise.asValue())
    promise.resolve(42)

    let result = try await runtime.eval("globalThis.testPromise").getPromise().await()

    #expect(result.getInt() == 42)
  }

  @Test
  func `promise can be chained in JavaScript`() async throws {
    let runtime = JavaScriptRuntime()
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

  @Test
  func `resolve with boolean`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)

    promise.resolve(JavaScriptValue(runtime, true))

    let result = try await promise.await()
    #expect(result.getBool() == true)
  }

  @Test
  func `resolve with null`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)

    promise.resolve(JavaScriptValue.null)

    let result = try await promise.await()
    #expect(result.isNull())
  }

  @Test
  func `resolve with undefined`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)

    promise.resolve(JavaScriptValue.undefined)

    let result = try await promise.await()
    #expect(result.isUndefined())
  }

  @Test
  func `resolve with array`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)

    promise.resolve([1, 2, 3])

    let result = try await promise.await().getArray()

    #expect(result.length == 3)
    #expect(result[0].getInt() == 1)
    #expect(result[1].getInt() == 2)
    #expect(result[2].getInt() == 3)
  }

  @Test
  func `multiple promises resolve independently`() async throws {
    let runtime = JavaScriptRuntime()
    let promise1 = try JavaScriptPromise(runtime)
    let promise2 = try JavaScriptPromise(runtime)

    promise1.resolve(10)
    promise2.resolve(20)

    let result1 = try await promise1.await()
    let result2 = try await promise2.await()

    #expect(result1.getInt() == 10)
    #expect(result2.getInt() == 20)
  }

  @Test
  func `promise from async JavaScript function`() async throws {
    let runtime = JavaScriptRuntime()
    let result =
      try await runtime
      .eval("(async function() { return 42; })")
      .getFunction()
      .call()
      .getPromise()
      .await()

    #expect(result.getInt() == 42)
  }

  @Test
  func `promise from async JavaScript function with arguments`() async throws {
    let runtime = JavaScriptRuntime()
    let result =
      try await runtime
      .eval("(async function(a, b) { return a + b; })")
      .getFunction()
      .call(arguments: 15, 27)
      .getPromise()
      .await()

    #expect(result.getInt() == 42)
  }

  @Test
  func `promise catches JavaScript errors`() async throws {
    let runtime = JavaScriptRuntime()
    let promise =
      try runtime
      .eval("(async function() { throw new Error('async error'); })")
      .getFunction()
      .call()
      .getPromise()

    await #expect(throws: Error.self) {
      return try await promise.await()
    }
  }

  @Test
  func `resolve promise from a task`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)

    // Resolve from a task
    Task.detached {
      try await Task.sleep(nanoseconds: 10_000_000)  // 10ms
      promise.resolve(JavaScriptValue(runtime, 99))
    }

    let result = try await promise.await()
    #expect(result.getInt() == 99)
  }

  @Test
  func `reject promise from a task while awaiting`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)

    struct TestError: Error {}

    // Reject after the await has already suspended on the pending promise. This must throw, not
    // resume the awaiting caller with the rejection value as if it were fulfilled.
    Task.detached {
      try await Task.sleep(nanoseconds: 10_000_000)  // 10ms
      promise.reject(TestError())
    }

    await #expect(throws: Error.self) {
      try await promise.await()
    }
  }

  @Test
  func `settling promise more than once is ignored`() async throws {
    struct TestError: Error, Sendable {}

    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)

    runtime.global().setProperty("testPromise", value: promise.asValue())
    promise.resolve(42)
    promise.reject(TestError())
    promise.resolve(100)

    let result = try await promise.await()

    #expect(result.getInt() == 42)
  }

  @Test
  func `promise all`() async throws {
    let runtime = JavaScriptRuntime()

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

    let array = try await promiseAll.await().getArray()

    #expect(array.length == 3)
    #expect(try array.getValue(at: 0).getInt() == 1)
    #expect(try array.getValue(at: 1).getInt() == 2)
    #expect(try array.getValue(at: 2).getInt() == 3)
  }

  @Test
  func `promise race`() async throws {
    let runtime = JavaScriptRuntime()

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
    let runtime = JavaScriptRuntime()
    let promise = try JavaScriptPromise(runtime)
    #expect(runtime.longLivedObjects.count == 1)

    promise.resolve(JavaScriptValue(runtime, 42))
    _ = try await promise.await()

    // Settling releases the resolve/reject functions, but the state stays registered so it continues
    // to own the promise object for as long as the wrapper is alive (it is only deregistered when the
    // wrapper is dropped, see the tests below, or by the teardown sweep).
    #expect(promise.isDeferred == false)
    #expect(runtime.longLivedObjects.count == 1)
  }

  @Test
  func `dropping a settled promise deregisters its state`() async throws {
    let runtime = JavaScriptRuntime()

    do {
      let promise = try JavaScriptPromise(runtime)
      promise.resolve(JavaScriptValue(runtime, 42))
      _ = try await promise.await()
      #expect(runtime.longLivedObjects.count == 1)
      // Leaving the scope drops the last owner of the wrapper.
    }

    // Dropping the wrapper deregisters its state and releases the promise object, so a stream of
    // short-lived promises doesn't pin their objects (and resolution values) until teardown.
    #expect(runtime.longLivedObjects.count == 0)
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
}
