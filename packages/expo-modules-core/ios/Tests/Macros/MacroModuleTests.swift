// Copyright 2024-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

// MARK: - Test modules

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
}
