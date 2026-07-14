import ExpoModulesJSI
import Foundation
import Testing

@Suite
@JavaScriptActor
struct JavaScriptRuntimeTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `get global`() {
    // Just check it does not crash
    _ = runtime.global()
  }

  @Test
  func `create plain object`() {
    _ = runtime.createObject()
  }

  @Test
  func `create object with prototype`() {
    let prototype = runtime.createObject()
    prototype.setProperty("test", value: 123)
    let object = runtime.createObject(prototype: prototype)
    #expect(object.getProperty("test").getDouble() == 123)
  }

  @Test
  func `create function`() {
    let fn = runtime.createFunction("function name") { this, arguments in
      return .undefined
    }
    #expect(fn.asValue().isFunction() == true)
  }

  @Test
  func `evaluate script`() throws {
    #expect(try runtime.eval("'hello' + ' ' + 'world'").getString() == "hello world")
    #expect(try runtime.eval("(function() {})").isFunction() == true)
  }

  @Test
  func `evaluate multiline script`() throws {
    #expect(try runtime.eval("const expo = 'expo'", "expo + 'jsi'").getString() == "expojsi")
  }

  @Test
  func `evaluate throws on error`() {
    #expect(throws: ScriptEvaluationError.self) {
      _ = try runtime.eval("1 + *")
    }
  }

  @Test
  func `evaluate to promise`() async throws {
    let result = try await runtime.evalAsync("'hello'")
    #expect(result.getString() == "hello")
  }

  @Test
  func `is equatable`() {
    #expect((runtime == runtime) == true)
    #expect((runtime != JavaScriptRuntime()) == true)
  }

  @Test
  func `execute sync evaluates JavaScript from non-async context`() throws {
    let result = try runtime.execute {
      try self.runtime.eval("2 + 2").getInt()
    }
    #expect(result == 4)
  }

  @Test
  func `execute sync throws error from non-async context`() {
    #expect(throws: ScriptEvaluationError.self) {
      _ = try runtime.execute {
        try self.runtime.eval("1 + *")
      }
    }
  }

  @Test
  func `execute async returns value`() async throws {
    let result: String = try await runtime.execute {
      await Task.yield()
      return "hello"
    }
    #expect(result == "hello")
  }

  @Test
  func `execute async awaits JavaScript evaluation`() async throws {
    let result = try await runtime.execute {
      try await self.runtime.evalAsync("Promise.resolve('async result')").getString()
    }
    #expect(result == "async result")
  }

  @Test
  func `execute async throws error`() async {
    await #expect(throws: ScriptEvaluationError.self) {
      _ = try await runtime.execute {
        await Task.yield()
        try self.runtime.eval("invalid syntax +++")
      }
    }
  }

  @Test
  func `execute async with operations`() async throws {
    let result = try await runtime.execute {
      await Task.yield()
      let obj = self.runtime.createObject()
      obj.setProperty("value", value: 100)
      return obj.getProperty("value").getInt()
    }
    #expect(result == 100)
  }

  // The execute<R> overloads have a same-thread fast path and a cross-thread path that
  // schedules the closure onto the JS thread and pumps the caller's run loop until it
  // completes. The tests above run on `@JavaScriptActor` (the JS thread), so they only
  // exercise the fast path. The next three hop off the JS thread first to cover the
  // cross-thread scheduling + run-loop pump. The sync overloads of `execute` are
  // `@available(*, noasync)`, so the caller must be a real synchronous thread — wrapping
  // in `Task.detached` would stay on the cooperative pool and trip the noasync diagnostic.

  @Test
  func `execute sync from off-thread caller`() async throws {
    let runtime = self.runtime
    let result = try await onSyncOffThread {
      try runtime.execute { @JavaScriptActor in
        return runtime.global().hasProperty("Object") ? 1 : 0
      }
    }
    #expect(result == 1)
  }

  @Test
  func `execute blocking-async from off-thread caller`() async throws {
    let runtime = self.runtime
    let result = try await onSyncOffThread {
      try runtime.execute { @JavaScriptActor () async in
        await Task.yield()
        return runtime.global().hasProperty("Object") ? 1 : 0
      }
    }
    #expect(result == 1)
  }

  @Test
  func `execute sync rethrows from off-thread caller`() async throws {
    let runtime = self.runtime
    await #expect(throws: ScriptEvaluationError.self) {
      try await onSyncOffThread {
        try runtime.execute { @JavaScriptActor in
          try runtime.eval("invalid syntax +++")
        }
      }
    }
  }

  // MARK: - Host objects

  @Test
  func `host object get property`() {
    let hostObject = runtime.createHostObject(
      get: { name in
        if name == "foo" {
          return JavaScriptValue(self.runtime, 42)
        }
        return .undefined
      },
      getPropertyNames: { ["foo"] }
    )

    #expect(hostObject.getProperty("foo").getInt() == 42)
    #expect(hostObject.getProperty("unknown").isUndefined())
  }

  @Test
  func `host object set property`() {
    var storedValue: Int?

    let hostObject = runtime.createHostObject(
      get: { name in
        if name == "value", let storedValue {
          return JavaScriptValue(self.runtime, storedValue)
        }
        return .undefined
      },
      set: { name, value in
        if name == "value" {
          storedValue = value.getInt()
        }
      },
      getPropertyNames: { ["value"] }
    )

    hostObject.setProperty("value", value: 99)
    #expect(storedValue == 99)
    #expect(hostObject.getProperty("value").getInt() == 99)
  }

  @Test
  func `host object property names`() throws {
    let hostObject = runtime.createHostObject(
      get: { name in
        switch name {
        case "a": return JavaScriptValue(self.runtime, 1)
        case "b": return JavaScriptValue(self.runtime, 2)
        default: return .undefined
        }
      },
      getPropertyNames: { ["a", "b"] }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())
    let keys = try runtime.eval("Object.keys(globalThis.hostObj)").getArray()

    #expect(keys.length == 2)
    #expect(keys[0].getString() == "a")
    #expect(keys[1].getString() == "b")
  }

  @Test
  func `host object accessible from JavaScript`() throws {
    let hostObject = runtime.createHostObject(
      get: { name in
        if name == "greeting" {
          return JavaScriptValue(self.runtime, "hello")
        }
        return .undefined
      },
      getPropertyNames: { ["greeting"] }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())
    let result = try runtime.eval("globalThis.hostObj.greeting")

    #expect(result.getString() == "hello")
  }

  @Test
  func `isHostObject distinguishes host objects from plain ones`() {
    let hostObject = runtime.createHostObject(
      get: { _ in .undefined }
    )
    let plainObject = runtime.createObject()

    #expect(hostObject.isHostObject() == true)
    #expect(plainObject.isHostObject() == false)
  }

  @Test
  func `host object default getPropertyNames returns no keys in JavaScript`() throws {
    let hostObject = runtime.createHostObject(
      get: { _ in .undefined }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let count = try runtime.eval("Object.keys(globalThis.hostObj).length")
    #expect(count.getInt() == 0)
  }

  // MARK: - Host object error propagation

  @Test
  func `throwing host object setter propagates error to JavaScript`() throws {
    struct TestError: Error, CustomStringConvertible {
      var description: String { "set failed" }
    }

    let hostObject = runtime.createHostObject(
      get: { _ in .undefined },
      set: { _, _ in throw TestError() }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval(
      """
        try { globalThis.hostObj.foo = 1; 'no error' } catch (e) { e.message }
      """)

    #expect(result.getString().contains("set failed"))
  }

  @Test
  func `throwing host object setter with JavaScriptThrowable preserves code`() throws {
    struct TypedError: JavaScriptThrowable {
      var message: String { "read only" }
      var code: String { "ERR_READ_ONLY" }
    }

    let hostObject = runtime.createHostObject(
      get: { _ in .undefined },
      set: { _, _ in throw TypedError() }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval(
      """
        try { globalThis.hostObj.foo = 1; null } catch (e) { [e.message, e.code] }
      """
    ).getArray()

    #expect(result[0].getString() == "read only")
    #expect(result[1].getString() == "ERR_READ_ONLY")
  }

  @Test
  func `throwing host object getter propagates error to JavaScript`() throws {
    struct TestError: Error, CustomStringConvertible {
      var description: String { "get failed" }
    }

    let hostObject = runtime.createHostObject(
      get: { _ in throw TestError() }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval(
      """
        try { globalThis.hostObj.foo; 'no error' } catch (e) { e.message }
      """)

    #expect(result.getString().contains("get failed"))
  }

  @Test
  func `throwing host object getter with JavaScriptThrowable preserves code`() throws {
    struct TypedError: JavaScriptThrowable {
      var message: String { "missing" }
      var code: String { "ERR_MISSING" }
    }

    let hostObject = runtime.createHostObject(
      get: { _ in throw TypedError() }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval(
      """
        try { globalThis.hostObj.foo; null } catch (e) { [e.message, e.code] }
      """
    ).getArray()

    #expect(result[0].getString() == "missing")
    #expect(result[1].getString() == "ERR_MISSING")
  }

  @Test
  func `host object setter recovers after throwing`() throws {
    struct TestError: Error, CustomStringConvertible {
      var description: String { "boom" }
    }
    var stored: Int = 0
    var shouldThrow = true

    let hostObject = runtime.createHostObject(
      get: { _ in JavaScriptValue(self.runtime, stored) },
      set: { _, value in
        if shouldThrow {
          throw TestError()
        }
        stored = value.getInt()
      },
      getPropertyNames: { ["value"] }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    // First write throws and is caught in JS.
    let firstAttempt = try runtime.eval(
      """
        try { globalThis.hostObj.value = 1; 'no error' } catch (e) { e.message }
      """)
    #expect(firstAttempt.getString().contains("boom"))

    // Subsequent write must succeed — verifies the C++ thread-local error
    // state is cleared after being rethrown, not leaked to the next call.
    shouldThrow = false
    let secondAttempt = try runtime.eval(
      """
        try { globalThis.hostObj.value = 7; globalThis.hostObj.value } catch (e) { -1 }
      """)
    #expect(secondAttempt.getInt() == 7)
  }

  @Test
  func `host object setter error does not pollute later getter`() throws {
    struct TestError: Error, CustomStringConvertible {
      var description: String { "set failed" }
    }

    let hostObject = runtime.createHostObject(
      get: { name in
        if name == "ok" {
          return JavaScriptValue(self.runtime, 123)
        }
        return .undefined
      },
      set: { _, _ in throw TestError() },
      getPropertyNames: { ["ok"] }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    // A failing set followed by a successful get must not surface the
    // earlier set error — checks the thread-local error slot is cleared.
    let result = try runtime.eval(
      """
        try { globalThis.hostObj.value = 1 } catch (e) {}
        globalThis.hostObj.ok
      """)

    #expect(result.getInt() == 123)
  }

  @Test
  func `read-only host object rejects assignment from JavaScript`() throws {
    let hostObject = runtime.createHostObject(
      get: { _ in JavaScriptValue(self.runtime, 1) }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    // No `set` was provided — the C++ side raises a `jsi::JSError` directly,
    // without crossing the Swift boundary.
    let result = try runtime.eval(
      """
        try { globalThis.hostObj.foo = 1; 'no error' } catch (e) { e.message }
      """)
    let message = result.getString()

    #expect(message.contains("read-only host object"))
    #expect(message.contains("'foo'"))
  }

  @Test
  func `non-throwing host object setter does not trigger error`() throws {
    var stored: Int = 0
    let hostObject = runtime.createHostObject(
      get: { _ in JavaScriptValue(self.runtime, stored) },
      set: { _, value in stored = value.getInt() },
      getPropertyNames: { ["value"] }
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval(
      """
        try { globalThis.hostObj.value = 7; globalThis.hostObj.value } catch (e) { -1 }
      """)

    #expect(result.getInt() == 7)
  }

  @Test
  func `host getter that calls failing JS preserves the original error`() throws {
    try runtime.eval(
      """
        globalThis.throwTagged = function () {
          const e = new Error('inner failure');
          e.code = 'ERR_INNER';
          throw e;
        };
      """)
    let throwTagged = try runtime.global().getPropertyAsFunction("throwTagged")

    let hostObject = runtime.createHostObject(
      get: { _ in
        // Calling JS that throws surfaces an `expo.CppError` wrapping the original
        // `jsi::JSError`. Letting it propagate exercises the CppError relay path.
        _ = try throwTagged.call()
        return .undefined
      }
    )
    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval(
      """
        try { globalThis.hostObj.foo; null } catch (e) { [e.message, e.code] }
      """
    ).getArray()

    #expect(result[0].getString() == "inner failure")
    #expect(result[1].getString() == "ERR_INNER")
  }

  @Test
  func `host setter that calls failing JS preserves the original error`() throws {
    try runtime.eval(
      """
        globalThis.throwTagged = function () {
          const e = new Error('inner setter failure');
          e.code = 'ERR_SETTER';
          throw e;
        };
      """)
    let throwTagged = try runtime.global().getPropertyAsFunction("throwTagged")

    let hostObject = runtime.createHostObject(
      get: { _ in .undefined },
      set: { _, _ in
        _ = try throwTagged.call()
      }
    )
    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval(
      """
        try { globalThis.hostObj.foo = 1; null } catch (e) { [e.message, e.code] }
      """
    ).getArray()

    #expect(result[0].getString() == "inner setter failure")
    #expect(result[1].getString() == "ERR_SETTER")
  }

  // MARK: - Host function error propagation

  @Test
  func `throwing host function propagates error to JavaScript`() throws {
    struct TestError: Error, CustomStringConvertible {
      var description: String { "something went wrong" }
    }

    let fn = runtime.createFunction("failing") { this, arguments in
      throw TestError()
    }

    runtime.global().setProperty("failing", value: fn.asValue())

    let result = try runtime.eval(
      """
        try { failing(); 'no error' } catch (e) { e.message }
      """)

    #expect(result.getString().contains("something went wrong"))
  }

  @Test
  func `throwing host function is catchable in JavaScript try-catch`() throws {
    struct TestError: Error, CustomStringConvertible {
      var description: String { "custom error message" }
    }

    let fn = runtime.createFunction("throwIt") { this, arguments in
      throw TestError()
    }

    runtime.global().setProperty("throwIt", value: fn.asValue())

    let result = try runtime.eval(
      """
        var caught = false;
        var message = '';
        try { throwIt(); } catch (e) { caught = true; message = e.message; }
        [caught, message]
      """
    ).getArray()

    #expect(result[0].getBool() == true)
    #expect(result[1].getString().contains("custom error message"))
  }

  @Test
  func `non-throwing host function does not trigger error`() throws {
    let fn = runtime.createFunction("ok") { this, arguments in
      return JavaScriptValue(self.runtime, 42)
    }

    runtime.global().setProperty("ok", value: fn.asValue())

    let result = try runtime.eval("try { ok() } catch (e) { -1 }")

    #expect(result.getInt() == 42)
  }

  // MARK: - Async functions

  @Test
  func `async function returns promise`() throws {
    let fn = runtime.createAsyncFunction("asyncFn") { this, arguments in
      return {
        return JavaScriptValue(self.runtime, 42)
      }
    }
    let result = try fn.call()

    #expect(result.isObject())
    #expect(result.is("Promise"))
  }

  @Test
  func `async function propagates promise construction failure`() throws {
    let fn = runtime.createAsyncFunction("asyncFn") { this, arguments in
      return {
        return JavaScriptValue(self.runtime, 42)
      }
    }
    runtime.global().setProperty("asyncFn", value: fn.asValue())
    try runtime.eval("globalThis.Promise = undefined")

    #expect(throws: Error.self) {
      _ = try runtime.eval("globalThis.asyncFn()")
    }
  }

  @Test
  func `async function resolves with value`() async throws {
    let fn = runtime.createAsyncFunction("asyncFn") { this, arguments in
      return {
        return JavaScriptValue(self.runtime, 42)
      }
    }

    let result = try await fn.call().getPromise().await()
    #expect(result.getInt() == 42)
  }

  @Test
  func `async function receives arguments`() async throws {
    let fn = runtime.createAsyncFunction("add") { this, arguments in
      // Decode phase: the buffer is only borrowed here and cannot escape into the body.
      let a = arguments[0].getInt()
      let b = arguments[1].getInt()
      return {
        return JavaScriptValue(self.runtime, a + b)
      }
    }

    let result = try await fn.call(arguments: 20, 22).getPromise().await()
    #expect(result.getInt() == 42)
  }

  @Test
  func `async function rejects on error thrown from the body`() async throws {
    struct TestError: Error {
      var localizedDescription: String { "something went wrong" }
    }

    let fn = runtime.createAsyncFunction("failing") { this, arguments in
      return {
        throw TestError()
      }
    }

    await #expect(throws: Error.self) {
      try await fn.call().getPromise().await()
    }
  }

  @Test
  func `async function rejects on error thrown from the decode phase`() async throws {
    struct TestError: Error {
      var localizedDescription: String { "something went wrong" }
    }

    let fn = runtime.createAsyncFunction("failing") { this, arguments in
      throw TestError()
    }

    // The closure throws before any suspension, but the call itself must not throw —
    // matching JavaScript's async-function semantics, the returned promise rejects instead.
    let promise = try fn.call().getPromise()
    await #expect(throws: Error.self) {
      try await promise.await()
    }
  }

  @Test
  func `async function callable from JavaScript`() async throws {
    let fn = runtime.createAsyncFunction("greet") { this, arguments in
      let name = arguments[0].getString()
      return {
        return JavaScriptValue(self.runtime, "Hello, \(name)!")
      }
    }

    runtime.global().setProperty("greet", value: fn.asValue())
    let result = try await runtime.evalAsync("Promise.resolve(greet('World'))")

    #expect(result.getString() == "Hello, World!")
  }

  @Test
  func `legacy async function receives owned arguments and resolves`() async throws {
    // The transitional overload for the current `expo-modules-macros` output: the closure runs in
    // asynchronous context and owns `this` and the arguments.
    let fn = runtime.createAsyncFunction("add") {
      (this: JavaScriptValue, arguments: consuming JavaScriptValuesBuffer) in
      let a = arguments[0].getInt()
      let b = arguments[1].getInt()
      return JavaScriptValue(self.runtime, a + b)
    }

    let result = try await fn.call(arguments: 20, 22).getPromise().await()
    #expect(result.getInt() == 42)
    // The pending-call box deregisters when the task runs, so a stream of calls doesn't pin their
    // arguments until teardown. Only never-run tasks stay registered.
    #expect(runtime.longLivedObjects.count == 0)
  }

  @Test
  func `legacy async function call dropped by a dying scheduler does not touch a freed runtime`() throws {
    // Same scenario as the test below, through the transitional owned-values overload: its copies
    // of `this` and the arguments are owned by the runtime's long-lived object collection, so the
    // teardown sweep releases them and the dropped task has nothing to destroy against freed memory.
    heldSchedulerTasks.removeAll()
    do {
      let baseRuntime = JavaScriptRuntime()
      let schedulerRuntime = baseRuntime.withUnsafePointee { pointer in
        JavaScriptRuntime(
          unsafePointer: pointer,
          scheduler: UnsafeMutableRawPointer(bitPattern: 0x1)!,
          dispatch: unsafeBitCast(holdSchedulerTask, to: UnsafeRawPointer.self)
        )
      }
      let fn = schedulerRuntime.createAsyncFunction("asyncFn") {
        (this: JavaScriptValue, arguments: consuming JavaScriptValuesBuffer) in
        return .undefined
      }
      _ = try fn.call(arguments: schedulerRuntime.createObject().asValue())
      #expect(heldSchedulerTasks.count == 1)
    }
    do {
      let droppedTasks = heldSchedulerTasks
      heldSchedulerTasks.removeAll()
      _ = consume droppedTasks
    }
  }

  @Test
  func `async function call dropped by a dying scheduler does not touch a freed runtime`() throws {
    // Regression test for the reload crash (#47716): the React runtime scheduler tears down with
    // async host function tasks still queued, and the dropped task closures used to own a copy of
    // the arguments buffer (and `this`). Their `jsi::Value` destructors then ran wherever the
    // dropped closures were released, against the already destroyed Hermes runtime — the
    // `JavaScriptValuesBuffer.deinit` use-after-free. With the two-phase `AsyncFunctionClosure`,
    // the decode happens within the host call and the scheduled task captures no JSI-owned values,
    // so dropping it after teardown is harmless.
    heldSchedulerTasks.removeAll()
    do {
      let baseRuntime = JavaScriptRuntime()
      let schedulerRuntime = baseRuntime.withUnsafePointee { pointer in
        JavaScriptRuntime(
          unsafePointer: pointer,
          // Opaque scheduler handle, never dereferenced by `holdSchedulerTask`.
          scheduler: UnsafeMutableRawPointer(bitPattern: 0x1)!,
          dispatch: unsafeBitCast(holdSchedulerTask, to: UnsafeRawPointer.self)
        )
      }
      // The body deliberately captures nothing: a captured runtime wrapper would outlive the
      // runtime inside the dropped task and tear down its cached `jsi::PropNameID`s against freed
      // memory — a separate, pre-existing hazard of wrappers outliving their runtime.
      let fn = schedulerRuntime.createAsyncFunction("asyncFn") { this, arguments in
        return {
          return .undefined
        }
      }
      // Call with a JS object argument — the kind whose destruction after teardown crashes.
      _ = try fn.call(arguments: schedulerRuntime.createObject().asValue())
      // The decode phase ran synchronously within the call; the async body is queued on the
      // scheduler, emulating a task that React never gets to run before the reload.
      #expect(heldSchedulerTasks.count == 1)
      // Leaving the scope destroys the Hermes runtime (emulating the reload) while the scheduler
      // still holds the task. The teardown sweep releases the promise's JSI state on this thread.
    }
    // The dying scheduler drops the task without ever running it. Releasing the last reference to
    // its closure must not touch the freed runtime — this is the crash point of #47716. Drained
    // through a local copy defensively: releasing a task can schedule follow-up work (e.g. the
    // promise wrapper's deinit schedules its cleanup while its runtime is still alive), which
    // would append to `heldSchedulerTasks` while `removeAll()` is mutating it.
    do {
      let droppedTasks = heldSchedulerTasks
      heldSchedulerTasks.removeAll()
      _ = consume droppedTasks
    }
  }

  // MARK: - Class creation

  @Test
  func `create class and construct instance`() throws {
    let klass = try runtime.createClass(name: "Point") { this, arguments in
      let obj = this.getObject()
      obj.setProperty("x", value: arguments[0])
      obj.setProperty("y", value: arguments[1])
      return this
    }

    let instance = try klass.callAsConstructor(10, 20)
    #expect(instance.getObject().getProperty("x").getInt() == 10)
    #expect(instance.getObject().getProperty("y").getInt() == 20)
  }

  @Test
  func `create class with inheritance`() throws {
    let baseClass = try runtime.createClass(name: "Base") { this, arguments in
      this.getObject().setProperty("base", value: true)
      return this
    }

    let childClass = try runtime.createClass(name: "Child", inheriting: baseClass) { this, arguments in
      this.getObject().setProperty("child", value: true)
      return this
    }

    let instance = try childClass.callAsConstructor()
    #expect(instance.getObject().getProperty("child").getBool() == true)
  }

  @Test
  func `create class is callable from JavaScript`() throws {
    let klass = try runtime.createClass(name: "Greeter") { this, arguments in
      this.getObject().setProperty("name", value: arguments[0])
      return this
    }

    runtime.global().setProperty("Greeter", value: klass.asValue())
    let result = try runtime.eval("new Greeter('World').name")

    #expect(result.getString() == "World")
  }

  @Test
  func `created class has correct name`() throws {
    let klass = try runtime.createClass(name: "MyClass") { this, arguments in
      return this
    }

    #expect(klass.asObject().getProperty("name").getString() == "MyClass")
  }

  @Test
  func `create class throws on invalid name with special characters`() {
    #expect(throws: JavaScriptRuntime.InvalidIdentifierError.self) {
      _ = try runtime.createClass(name: "bad); evil(") { this, _ in this }
    }
  }

  @Test
  func `create class throws on empty name`() {
    #expect(throws: JavaScriptRuntime.InvalidIdentifierError.self) {
      _ = try runtime.createClass(name: "") { this, _ in this }
    }
  }

  @Test
  func `create class throws on name starting with digit`() {
    #expect(throws: JavaScriptRuntime.InvalidIdentifierError.self) {
      _ = try runtime.createClass(name: "1Foo") { this, _ in this }
    }
  }

  @Test
  func `create class accepts valid identifier with dollar and underscore`() throws {
    let klass = try runtime.createClass(name: "$_Foo123") { this, _ in this }
    #expect(klass.asObject().getProperty("name").getString() == "$_Foo123")
  }

  // MARK: - Unsafe pointee access

  @Test
  func `withUnsafePointee returns non-null pointee`() {
    runtime.withUnsafePointee { runtimePointee in
      #expect(runtimePointee != UnsafeMutableRawPointer(bitPattern: 0))
    }
  }

  @Test
  func `withUnsafePointee returns value from closure`() {
    let result = runtime.withUnsafePointee { _ in
      return 42
    }
    #expect(result == 42)
  }

  @Test
  func `withUnsafePointee returns same pointee across calls`() {
    let pointee1 = runtime.withUnsafePointee { return $0 }
    let pointee2 = runtime.withUnsafePointee { return $0 }
    #expect(pointee1 == pointee2)
  }

  @Test
  func `init from unsafePointer creates functional runtime`() throws {
    let newRuntime = runtime.withUnsafePointee { runtimePointee in
      return JavaScriptRuntime(unsafePointer: runtimePointee)
    }
    let result = try newRuntime.eval("1 + 2")
    #expect(result.getInt() == 3)
  }

  @Test
  func `id is equal across wrappers of the same underlying runtime`() {
    // A second wrapper around the same underlying `jsi::Runtime` shares the runtime's identity, even
    // though it is a distinct `JavaScriptRuntime` instance (so `===` differs). This is the guarantee
    // `id` provides over wrapper identity.
    let otherWrapper = runtime.withUnsafePointee { JavaScriptRuntime(unsafePointer: $0) }
    #expect(otherWrapper.id == runtime.id)
    #expect(otherWrapper !== runtime)
  }

  @Test
  func `id differs between distinct runtimes`() {
    let otherRuntime = JavaScriptRuntime()
    #expect(otherRuntime.id != runtime.id)
  }

  @Test
  func `creating and releasing standalone runtimes repeatedly does not crash`() throws {
    // Each standalone runtime owns its Hermes runtime and destroys it on `deinit`. Cycling through
    // many create/use/release rounds exercises that teardown and would surface a use-after-free or
    // double-free (destroying a runtime must not corrupt a subsequently created one). Calling `is`
    // caches a `PropNameID` on the runtime, so this also covers releasing cached JSI objects before
    // the runtime is freed.
    for index in 0..<20 {
      let localRuntime = JavaScriptRuntime()
      let value = try localRuntime.eval("({ index: \(index) })")
      #expect(value.is("Object") == true)
      #expect(value.getObject().getProperty("index").getInt() == index)
    }
  }

  // MARK: - Long-lived objects teardown

  /// Records whether `allowRelease()` was called.
  final class TrackedObject: LongLivedObject {
    private(set) var released = false

    func allowRelease() {
      released = true
    }
  }

  @Test
  func `tearing down the runtime clears its long-lived objects`() {
    let tracked = TrackedObject()

    do {
      let localRuntime = JavaScriptRuntime()
      localRuntime.longLivedObjects.add(tracked)
      #expect(localRuntime.longLivedObjects.count == 1)
      // Leaving the scope releases the runtime. Its `deinit` destroys the owned Hermes runtime,
      // tearing down the JS heap, which drops the teardown object's native state and fires its
      // deallocator, sweeping the collection.
    }

    #expect(tracked.released == true)
  }

  @Test
  func `an object removed before teardown is not released by the sweep`() {
    let tracked = TrackedObject()

    do {
      let localRuntime = JavaScriptRuntime()
      localRuntime.longLivedObjects.add(tracked)
      localRuntime.longLivedObjects.remove(tracked)
    }

    #expect(tracked.released == false)
  }

  @Test
  func `wrapping the same runtime again does not sweep the first wrapper's objects`() {
    // Each wrapper pins its own teardown object under a per-wrapper property name. A second wrapper
    // of the same underlying runtime must not overwrite the first's pinned object (which would let
    // it be collected early and sweep the first wrapper's collection while the runtime is alive).
    let tracked = TrackedObject()
    runtime.longLivedObjects.add(tracked)
    _ = runtime.withUnsafePointee { JavaScriptRuntime(unsafePointer: $0) }
    #expect(tracked.released == false)
    #expect(runtime.longLivedObjects.count == 1)
  }
}

/// Tasks captured by `holdSchedulerTask` instead of being executed, emulating a React
/// `RuntimeScheduler` that is torn down with work still queued (the #47716 reload scenario).
/// Safe without synchronization: the dispatch always runs synchronously on the test's thread.
nonisolated(unsafe) private var heldSchedulerTasks: [() -> Void] = []

/// A `dispatch` trampoline for `JavaScriptRuntime.init(unsafePointer:scheduler:dispatch:)` that
/// holds the scheduled tasks instead of running them, so a test controls when (and whether) they
/// are released. Matches `expo.RuntimeScheduler.ScheduleFn`.
private let holdSchedulerTask:
  @convention(c) (
    UnsafeMutableRawPointer?, Int32, @escaping @convention(block) () -> Void
  ) -> Void = { _, _, callback in
    heldSchedulerTasks.append(callback)
  }

/// Runs `body` on a freshly spawned synchronous thread and bridges the result back into the
/// async test. The thread has a real run loop, which the cross-thread `execute` path pumps.
private func onSyncOffThread<R: Sendable>(
  _ body: @escaping @Sendable () throws -> R
) async throws -> R {
  return try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<R, any Error>) in
    Thread.detachNewThread {
      do {
        continuation.resume(returning: try body())
      } catch {
        continuation.resume(throwing: error)
      }
    }
  }
}
