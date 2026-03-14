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
    let fn = runtime.createSyncFunction("function name") { this, arguments in
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
}
