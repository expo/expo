import Testing
import ExpoModulesJSI

@Suite
@JavaScriptActor
struct JavaScriptPromiseTests {
  @Test
  func `create deferred promise`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = JavaScriptPromise(runtime)

    #expect(promise.isDeferred == false)
  }

  @Test
  func `resolve promise with value`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = JavaScriptPromise(runtime)

    promise.resolve(JavaScriptValue(runtime, 42))

    let result = try await promise.await()
    #expect(result.getInt() == 42)
  }

  @Test
  func `resolve promise with string`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = JavaScriptPromise(runtime)

    promise.resolve(JavaScriptValue(runtime, "hello"))

    let result = try await promise.await()
    #expect(result.getString() == "hello")
  }

  @Test
  func `resolve promise with object`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = JavaScriptPromise(runtime)

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
    let promise = JavaScriptPromise(runtime)

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
  func `wrap pending promise that resolves later`() async throws {
    let runtime = JavaScriptRuntime()
    let pendingPromise = try runtime.eval("new Promise((resolve) => { setImmediate(() => resolve(100)) })").getPromise()
    let result = try await pendingPromise.await()

    #expect(result.getInt() == 100)
  }

  @Test
  func `asValue returns promise object`() {
    let runtime = JavaScriptRuntime()
    let promise = JavaScriptPromise(runtime)
    let value = promise.asValue()

    #expect(value.isObject())
  }

  @Test
  func `promise can be passed to JavaScript`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = JavaScriptPromise(runtime)

    runtime.global().setProperty("testPromise", value: promise.asValue())
    promise.resolve(42)

    let result = try await runtime.eval("globalThis.testPromise").getPromise().await()

    #expect(result.getInt() == 42)
  }

  @Test
  func `promise can be chained in JavaScript`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = JavaScriptPromise(runtime)

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
    let promise = JavaScriptPromise(runtime)

    promise.resolve(JavaScriptValue(runtime, true))

    let result = try await promise.await()
    #expect(result.getBool() == true)
  }

  @Test
  func `resolve with null`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = JavaScriptPromise(runtime)

    promise.resolve(JavaScriptValue.null())

    let result = try await promise.await()
    #expect(result.isNull())
  }

  @Test
  func `resolve with undefined`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = JavaScriptPromise(runtime)

    promise.resolve(JavaScriptValue.undefined())

    let result = try await promise.await()
    #expect(result.isUndefined())
  }

  @Test
  func `resolve with array`() async throws {
    let runtime = JavaScriptRuntime()
    let promise = JavaScriptPromise(runtime)

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
    let promise1 = JavaScriptPromise(runtime)
    let promise2 = JavaScriptPromise(runtime)

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
    let result = try await runtime
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
    let result = try await runtime
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
    let promise = try runtime
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
    let promise = JavaScriptPromise(runtime)

    // Resolve from a task
    Task.detached {
      try await Task.sleep(nanoseconds: 10_000_000) // 10ms
      promise.resolve(JavaScriptValue(runtime, 99))
    }

    let result = try await promise.await()
    #expect(result.getInt() == 99)
  }

  @Test
  func `promise all`() async throws {
    let runtime = JavaScriptRuntime()

    let promise1 = JavaScriptPromise(runtime)
    let promise2 = JavaScriptPromise(runtime)
    let promise3 = JavaScriptPromise(runtime)

    runtime.global().setProperty("p1", value: promise1.asValue())
    runtime.global().setProperty("p2", value: promise2.asValue())
    runtime.global().setProperty("p3", value: promise3.asValue())

    let promiseAll = try runtime
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

    let promise1 = JavaScriptPromise(runtime)
    let promise2 = JavaScriptPromise(runtime)

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

    #expect(promise.isDeferred == true)
  }
}

