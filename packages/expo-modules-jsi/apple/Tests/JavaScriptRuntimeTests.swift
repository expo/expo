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
      return .undefined()
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
        return .undefined()
      },
      set: { _, _ in },
      getPropertyNames: { ["foo"] },
      dealloc: {}
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
        return .undefined()
      },
      set: { name, value in
        if name == "value" {
          storedValue = value.getInt()
        }
      },
      getPropertyNames: { ["value"] },
      dealloc: {}
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
        default: return .undefined()
        }
      },
      set: { _, _ in },
      getPropertyNames: { ["a", "b"] },
      dealloc: {}
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
        return .undefined()
      },
      set: { _, _ in },
      getPropertyNames: { ["greeting"] },
      dealloc: {}
    )

    runtime.global().setProperty("hostObj", value: hostObject.asValue())
    let result = try runtime.eval("globalThis.hostObj.greeting")

    #expect(result.getString() == "hello")
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
}
