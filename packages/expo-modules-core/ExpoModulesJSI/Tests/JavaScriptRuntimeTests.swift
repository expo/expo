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
    prototype.setProperty("test", 123)
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
}
