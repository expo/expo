// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

/// A module that records calls to the module lifecycle hooks.
private final class LifecycleHooksModule: Module {
  var didCreateCalls: Int = 0
  var willDestroyCalls: Int = 0
  var startedListeningEvents: [String] = []
  var stoppedListeningEvents: [String] = []

  /// Whether the module could find its own holder in the registry from within `didCreate`.
  /// It relies on `withEventTarget` which looks the holder up in the module registry, so it's
  /// `true` only when the hook runs after the holder has been registered.
  var wasRegisteredDuringDidCreate: Bool = false

  override func didCreate() {
    didCreateCalls += 1
    wasRegisteredDuringDidCreate = appContext?.moduleRegistry.contains { $0.module === self } ?? false
  }

  override func willDestroy() {
    willDestroyCalls += 1
  }

  override func didStartListening(event: String) {
    startedListeningEvents.append(event)
  }

  override func didStopListening(event: String) {
    stoppedListeningEvents.append(event)
  }
}

/// A base class that conforms to `Module` but doesn't implement any lifecycle hooks.
private class EmptyBaseModule: Module {}

/// A module that inherits the `Module` conformance from its base class and adds a hook itself.
private final class SubclassedLifecycleModule: EmptyBaseModule {
  var didCreateCalls: Int = 0

  override func didCreate() {
    didCreateCalls += 1
  }
}

/// A macro module that doesn't inherit `Module`, so it conforms to `AnyModule`
/// through the extension added by the `@ExpoModule` macro.
@ExpoModule
private final class MacroLifecycleModule {
  var didCreateCalls: Int = 0

  func didCreate() {
    didCreateCalls += 1
  }
}

@Suite("Module lifecycle hooks")
@JavaScriptActor
private struct ModuleLifecycleHooksTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      return try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
  }

  @Test
  func `calls didCreate once the module is registered`() {
    let module = LifecycleHooksModule(appContext: appContext)
    #expect(module.didCreateCalls == 0)
    appContext.moduleRegistry.register(module: module, name: nil)
    #expect(module.didCreateCalls == 1)
  }

  @Test
  func `calls didCreate after the module is put into the registry`() {
    let module = LifecycleHooksModule(appContext: appContext)
    appContext.moduleRegistry.register(module: module, name: nil)
    #expect(module.wasRegisteredDuringDidCreate)
  }

  @Test
  func `doesn't call didCreate for a registration rejected by preventModuleOverriding`() {
    let firstModule = LifecycleHooksModule(appContext: appContext)
    appContext.moduleRegistry.register(module: firstModule, name: "SharedName", preventModuleOverriding: true)
    let secondModule = LifecycleHooksModule(appContext: appContext)
    appContext.moduleRegistry.register(module: secondModule, name: "SharedName", preventModuleOverriding: true)
    #expect(firstModule.didCreateCalls == 1)
    #expect(secondModule.didCreateCalls == 0)
  }

  @Test
  func `calls didCreate on a module that inherits the conformance from its base class`() {
    let module = SubclassedLifecycleModule(appContext: appContext)
    appContext.moduleRegistry.register(module: module, name: nil)
    #expect(module.didCreateCalls == 1)
  }

  @Test
  func `calls didCreate on a macro module that doesn't inherit the Module class`() {
    let module = MacroLifecycleModule(appContext: appContext)
    appContext.moduleRegistry.register(module: module, name: nil)
    #expect(module.didCreateCalls == 1)
  }

  @Test
  func `calls willDestroy once the module is about to be deallocated`() {
    let module = LifecycleHooksModule(appContext: appContext)
    appContext.moduleRegistry.register(module: module, name: nil)
    #expect(module.willDestroyCalls == 0)
    appContext.moduleRegistry.unregister(moduleName: "LifecycleHooksModule")
    #expect(module.willDestroyCalls == 1)
  }

  @Test
  func `calls didStartListening when the first listener is added`() throws {
    let module = LifecycleHooksModule(appContext: appContext)
    appContext.moduleRegistry.register(module: module, name: nil)
    try runtime.eval(
      """
      module = expo.modules.LifecycleHooksModule
      module.addListener('testEvent', () => {})
      module.addListener('testEvent', () => {})
      """)
    #expect(module.startedListeningEvents == ["testEvent"])
    #expect(module.stoppedListeningEvents == [])
  }

  @Test
  func `calls didStopListening when the last listener is removed`() throws {
    let module = LifecycleHooksModule(appContext: appContext)
    appContext.moduleRegistry.register(module: module, name: nil)
    try runtime.eval(
      """
      module = expo.modules.LifecycleHooksModule
      listenerA = () => {}
      listenerB = () => {}
      module.addListener('testEvent', listenerA)
      module.addListener('testEvent', listenerB)
      module.removeListener('testEvent', listenerA)
      """)
    #expect(module.stoppedListeningEvents == [])
    try runtime.eval("module.removeListener('testEvent', listenerB)")
    #expect(module.stoppedListeningEvents == ["testEvent"])
  }

  @Test
  func `tracks listened events separately`() throws {
    let module = LifecycleHooksModule(appContext: appContext)
    appContext.moduleRegistry.register(module: module, name: nil)
    try runtime.eval(
      """
      module = expo.modules.LifecycleHooksModule
      module.addListener('eventA', () => {})
      module.addListener('eventB', () => {})
      module.removeAllListeners('eventB')
      """)
    #expect(module.startedListeningEvents == ["eventA", "eventB"])
    #expect(module.stoppedListeningEvents == ["eventB"])
  }
}
