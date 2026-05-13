import Testing
import ExpoModulesJSI

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

    let result = try runtime.eval("""
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

    let result = try runtime.eval("""
      try { globalThis.hostObj.foo = 1; null } catch (e) { [e.message, e.code] }
    """).getArray()

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

    let result = try runtime.eval("""
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

    let result = try runtime.eval("""
      try { globalThis.hostObj.foo; null } catch (e) { [e.message, e.code] }
    """).getArray()

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
    let firstAttempt = try runtime.eval("""
      try { globalThis.hostObj.value = 1; 'no error' } catch (e) { e.message }
    """)
    #expect(firstAttempt.getString().contains("boom"))

    // Subsequent write must succeed — verifies the C++ thread-local error
    // state is cleared after being rethrown, not leaked to the next call.
    shouldThrow = false
    let secondAttempt = try runtime.eval("""
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
    let result = try runtime.eval("""
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
    let result = try runtime.eval("""
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

    let result = try runtime.eval("""
      try { globalThis.hostObj.value = 7; globalThis.hostObj.value } catch (e) { -1 }
    """)

    #expect(result.getInt() == 7)
  }

  @Test
  func `host getter that calls failing JS preserves the original error`() throws {
    try runtime.eval("""
      globalThis.throwTagged = function () {
        const e = new Error('inner failure');
        e.code = 'ERR_INNER';
        throw e;
      };
    """)
    let throwTagged = runtime.global().getPropertyAsFunction("throwTagged")

    let hostObject = runtime.createHostObject(
      get: { _ in
        // Calling JS that throws surfaces an `expo.CppError` wrapping the original
        // `jsi::JSError`. Letting it propagate exercises the CppError relay path.
        _ = try throwTagged.call()
        return .undefined
      }
    )
    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval("""
      try { globalThis.hostObj.foo; null } catch (e) { [e.message, e.code] }
    """).getArray()

    #expect(result[0].getString() == "inner failure")
    #expect(result[1].getString() == "ERR_INNER")
  }

  @Test
  func `host setter that calls failing JS preserves the original error`() throws {
    try runtime.eval("""
      globalThis.throwTagged = function () {
        const e = new Error('inner setter failure');
        e.code = 'ERR_SETTER';
        throw e;
      };
    """)
    let throwTagged = runtime.global().getPropertyAsFunction("throwTagged")

    let hostObject = runtime.createHostObject(
      get: { _ in .undefined },
      set: { _, _ in
        _ = try throwTagged.call()
      }
    )
    runtime.global().setProperty("hostObj", value: hostObject.asValue())

    let result = try runtime.eval("""
      try { globalThis.hostObj.foo = 1; null } catch (e) { [e.message, e.code] }
    """).getArray()

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

    let result = try runtime.eval("""
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

    let result = try runtime.eval("""
      var caught = false;
      var message = '';
      try { throwIt(); } catch (e) { caught = true; message = e.message; }
      [caught, message]
    """).getArray()

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
      return JavaScriptValue(self.runtime, 42)
    }
    let result = try fn.call()

    #expect(result.isObject())
    #expect(result.is("Promise"))
  }

  @Test
  func `async function resolves with value`() async throws {
    let fn = runtime.createAsyncFunction("asyncFn") { this, arguments in
      return JavaScriptValue(self.runtime, 42)
    }

    let result = try await fn.call().getPromise().await()
    #expect(result.getInt() == 42)
  }

  @Test
  func `async function receives arguments`() async throws {
    let fn = runtime.createAsyncFunction("add") { this, arguments in
      let a = arguments[0].getInt()
      let b = arguments[1].getInt()
      return JavaScriptValue(self.runtime, a + b)
    }

    let result = try await fn.call(arguments: 20, 22).getPromise().await()
    #expect(result.getInt() == 42)
  }

  @Test
  func `async function rejects on error`() async throws {
    struct TestError: Error {
      var localizedDescription: String { "something went wrong" }
    }

    let fn = runtime.createAsyncFunction("failing") { this, arguments in
      throw TestError()
    }

    await #expect(throws: Error.self) {
      try await fn.call().getPromise().await()
    }
  }

  @Test
  func `async function callable from JavaScript`() async throws {
    let fn = runtime.createAsyncFunction("greet") { this, arguments in
      let name = arguments[0].getString()
      return JavaScriptValue(self.runtime, "Hello, \(name)!")
    }

    runtime.global().setProperty("greet", value: fn.asValue())
    let result = try await runtime.evalAsync("Promise.resolve(greet('World'))")

    #expect(result.getString() == "Hello, World!")
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
}
