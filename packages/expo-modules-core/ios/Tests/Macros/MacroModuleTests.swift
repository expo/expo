// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

// MARK: - Test modules

@Record
private struct MacroOptions {
  var label: String = ""
  var count: Int = 0
}

// `@unchecked Sendable`: the `@JS(.concurrent)` members send `self` off the JavaScript thread,
// which Swift 6 mode allows only for a `Sendable` module.
@ExpoModule
private final class MacroGreeter: Module, @unchecked Sendable {
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

  // An `Either` argument and return. The return is an `EitherOfThree`, which conforms through the
  // conformance inherited from `Either`.
  @JS
  func describe(value: Either<String, Int>) -> EitherOfThree<String, Int, Bool> {
    if let string: String = value.get() {
      return EitherOfThree(string.uppercased())
    }
    return EitherOfThree(value.is(Int.self))
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

  // An async function whose body runs off the JS thread, on the concurrent pool.
  @JS(.concurrent)
  func offThread(value: String) async throws -> String {
    return value
  }

  // The `.concurrent` option combined with a JS name override.
  @JS("renamedOffThread", .concurrent)
  func offThreadWithName(value: String) async throws -> String {
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

// Closure arguments: JS passes a function, and the binding wraps it in a native closure.
@ExpoModule
private final class MacroCallbacks: Module {
  private var stored: ((String) -> Void)?

  @JS
  func transform(value: Int, using transform: (Int) throws -> Int) throws -> Int {
    return try transform(value)
  }

  // A `Record` crosses into the closure, so its argument is encoded on the way to JS.
  @JS
  func describe(options: MacroOptions, format: (MacroOptions) throws -> String) throws -> String {
    return try format(options)
  }

  // Keeps the closure past the call that received it.
  @JS
  func store(onEvent: @escaping (String) -> Void) {
    stored = onEvent
  }

  @JS
  func fire(value: String) {
    stored?(value)
  }

  // Returns whether a closure was passed.
  @JS
  func optional(callback: ((String) throws -> Void)?) throws -> Bool {
    try callback?("called")
    return callback != nil
  }

  @JS
  @JavaScriptActor
  func awaitCallback(fetch: @escaping (Int) async throws -> Int) async throws -> Int {
    return try await fetch(20) + 1
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
    appContext = TestAppContext()
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

  @Test
  func `binds a @JS(.concurrent) async function that returns a promise`() async throws {
    register(MacroGreeter(appContext: appContext))
    let result = try await runtime.evalAsync("expo.modules.MacroGreeter.offThread('done')")
    #expect(try await result.asString() == "done")
  }

  @Test
  func `honors the @JS name override combined with .concurrent`() async throws {
    register(MacroGreeter(appContext: appContext))
    let result = try await runtime.evalAsync("expo.modules.MacroGreeter.renamedOffThread('done')")
    #expect(try await result.asString() == "done")
    #expect(try runtime.eval("'offThreadWithName' in expo.modules.MacroGreeter").asBool() == false)
  }

  // MARK: - Non-primitive decode/encode

  @Test
  func `decodes and encodes a Record across a @JS function`() throws {
    register(MacroGreeter(appContext: appContext))
    let result = try runtime.eval("expo.modules.MacroGreeter.repeated({ label: 'a', count: 2 })").asObject()
    #expect(try result.getProperty("label").asString() == "a")
    #expect(try result.getProperty("count").asInt() == 3)
  }

  @Test
  func `decodes and encodes an Either across a @JS function`() throws {
    register(MacroGreeter(appContext: appContext))
    #expect(try runtime.eval("expo.modules.MacroGreeter.describe('expo')").asString() == "EXPO")
    #expect(try runtime.eval("expo.modules.MacroGreeter.describe(42)").asBool() == true)
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

  // MARK: - Closure arguments

  @Test
  func `a closure argument calls back into JS and returns its result`() throws {
    register(MacroCallbacks(appContext: appContext))
    #expect(try runtime.eval("expo.modules.MacroCallbacks.transform(20, (x) => x * 2 + 2)").asInt() == 42)
  }

  @Test
  func `a closure argument encodes a Record for JS`() throws {
    register(MacroCallbacks(appContext: appContext))
    let format = "(options) => options.label + options.count"
    let result = try runtime.eval("expo.modules.MacroCallbacks.describe({ label: 'a', count: 2 }, \(format))")
    #expect(try result.asString() == "a2")
  }

  @Test
  func `a JS exception in a closure argument reaches the JS caller`() throws {
    register(MacroCallbacks(appContext: appContext))
    let message = try runtime.eval(
      """
      try {
        expo.modules.MacroCallbacks.transform(1, () => { throw new Error('nope') })
        ''
      } catch (error) {
        error.message
      }
      """)
    #expect(try message.asString().contains("nope"))
  }

  @Test
  func `null or undefined for a required closure argument throws a TypeError`() throws {
    register(MacroCallbacks(appContext: appContext))
    for value in ["null", "undefined"] {
      let message = try runtime.eval(
        "try { expo.modules.MacroCallbacks.transform(1, \(value)); '' } catch (error) { error.message }")
      #expect(try message.asString().contains("TypeError"))
    }
  }

  @Test
  func `a stored closure argument can be called later`() throws {
    register(MacroCallbacks(appContext: appContext))
    let value = try runtime.eval(
      """
      expo.modules.MacroCallbacks.store((value) => { globalThis.received = value })
      expo.modules.MacroCallbacks.fire('later')
      globalThis.received
      """)
    #expect(try value.asString() == "later")
  }

  @Test
  func `an optional closure argument is nil when omitted or null`() throws {
    register(MacroCallbacks(appContext: appContext))
    #expect(try runtime.eval("expo.modules.MacroCallbacks.optional()").asBool() == false)
    #expect(try runtime.eval("expo.modules.MacroCallbacks.optional(null)").asBool() == false)
    #expect(try runtime.eval("expo.modules.MacroCallbacks.optional(() => {})").asBool() == true)
  }

  @Test
  func `an async closure argument awaits the promise the JS function returns`() async throws {
    register(MacroCallbacks(appContext: appContext))
    let result = try await runtime.evalAsync("expo.modules.MacroCallbacks.awaitCallback(async (x) => x * 2)")
    #expect(try await result.asInt() == 41)
  }
}
