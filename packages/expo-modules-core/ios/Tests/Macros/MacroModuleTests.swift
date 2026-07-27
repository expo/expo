// Copyright 2024-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

// MARK: - Test modules

@Record
private struct MacroOptions {
  var label: String = ""
  var count: Int = 0
}

@ExpoModule
private final class MacroGreeter: Module {
  @JS
  func greet(name: String) -> String {
    return "Hi, \(name)"
  }

  @JS("sum")
  func add(a: Double, b: Double) -> Double {
    return a + b
  }

  @JS
  var status: String {
    return "ok"
  }

  // A settable stored property.
  @JS
  var nickname: String = ""

  // A `Record` argument and return.
  @JS
  func repeated(options: MacroOptions) -> MacroOptions {
    return MacroOptions(label: options.label, count: options.count + 1)
  }

  // A throwing function, whose coded error surfaces to JS.
  @JS
  func fail() throws {
    throw TestCodedException()
  }

  // An async function, which returns a Promise on the JS side.
  @JS
  @JavaScriptActor
  func delayed(value: String) async throws -> String {
    return value
  }
}

@ExpoModule("RenamedMacroModule")
private final class MacroRenamed: Module {
  @JS
  func ping() -> String {
    return "pong"
  }
}

@Suite("Macro module")
@JavaScriptActor
private struct MacroModuleTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
  }

  private func register(_ module: AnyModule) {
    // `name: nil` so module naming falls through to the macro-synthesized `_jsName`.
    appContext.moduleRegistry.register(module: module, name: nil)
  }

  // MARK: - Naming

  @Test
  func `module name defaults to the class name`() throws {
    register(MacroGreeter(appContext: appContext))
    #expect(MacroGreeter._jsName == "MacroGreeter")
    #expect(try runtime.eval("typeof expo.modules.MacroGreeter").asString() == "object")
  }

  @Test
  func `module name honors the @ExpoModule argument`() throws {
    register(MacroRenamed(appContext: appContext))
    #expect(MacroRenamed._jsName == "RenamedMacroModule")
    #expect(try runtime.eval("expo.modules.RenamedMacroModule.ping()").asString() == "pong")
  }

  @Test
  func `synthesized name backs the module's __expo_module_name__`() throws {
    register(MacroRenamed(appContext: appContext))
    // `__expo_module_name__` comes from the definition's name, which legacy event-emitter and
    // view-manager compatibility paths look up by; it must match the registered module name.
    #expect(try runtime.eval("expo.modules.RenamedMacroModule.__expo_module_name__").asString() == "RenamedMacroModule")
  }

  // MARK: - @JS functions

  @Test
  func `binds a @JS function`() throws {
    register(MacroGreeter(appContext: appContext))
    #expect(try runtime.eval("typeof expo.modules.MacroGreeter.greet").asString() == "function")
    #expect(try runtime.eval("expo.modules.MacroGreeter.greet('Expo')").asString() == "Hi, Expo")
  }

  @Test
  func `honors the @JS name override`() throws {
    register(MacroGreeter(appContext: appContext))
    #expect(try runtime.eval("expo.modules.MacroGreeter.sum(2, 3)").asDouble() == 5)
    #expect(try runtime.eval("'add' in expo.modules.MacroGreeter").asBool() == false)
  }

  // MARK: - @JS properties

  @Test
  func `binds a @JS property`() throws {
    register(MacroGreeter(appContext: appContext))
    #expect(try runtime.eval("expo.modules.MacroGreeter.status").asString() == "ok")
  }

  @Test
  func `binds a settable @JS property, decoding the assigned value`() throws {
    register(MacroGreeter(appContext: appContext))
    let value = try runtime.eval(
      """
      expo.modules.MacroGreeter.nickname = 'Ada'
      expo.modules.MacroGreeter.nickname
      """)
    #expect(try value.asString() == "Ada")
  }

  // MARK: - Async functions

  @Test
  func `binds an async @JS function that returns a promise`() async throws {
    register(MacroGreeter(appContext: appContext))
    let result = try await runtime.evalAsync("expo.modules.MacroGreeter.delayed('done')")
    #expect(try await result.asString() == "done")
  }

  // MARK: - Non-primitive decode/encode

  @Test
  func `decodes and encodes a Record across a @JS function`() throws {
    register(MacroGreeter(appContext: appContext))
    let result = try runtime.eval("expo.modules.MacroGreeter.repeated({ label: 'a', count: 2 })").asObject()
    #expect(try result.getProperty("label").asString() == "a")
    #expect(try result.getProperty("count").asInt() == 3)
  }

  // MARK: - Error propagation

  @Test
  func `a throwing @JS function surfaces a coded JS error`() throws {
    register(MacroGreeter(appContext: appContext))
    let code = try runtime.eval("try { expo.modules.MacroGreeter.fail() } catch (error) { error.code }")
    #expect(try code.asString() == "E_TEST_CODE")
  }

  // MARK: - Argument arity

  @Test
  func `calling a @JS function with the wrong argument count throws`() throws {
    register(MacroGreeter(appContext: appContext))
    // `greet` takes one argument; calling it with none trips the synthesized arity check, whose
    // message names the function and the argument counts.
    let message = try runtime.eval("try { expo.modules.MacroGreeter.greet(); '' } catch (error) { error.message }")
    #expect(try message.asString().contains("greet"))
    #expect(try message.asString().contains("argument"))
  }
}
