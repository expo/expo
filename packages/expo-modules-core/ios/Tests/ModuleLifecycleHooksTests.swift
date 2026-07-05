// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

/// A module that records calls to the module lifecycle hooks.
private final class LifecycleHooksModule: Module {
  var didCreateCalls: Int = 0
  var willDestroyCalls: Int = 0
  var startedListeningEvents: [String] = []
  var stoppedListeningEvents: [String] = []

  func didCreate() {
    didCreateCalls += 1
  }

  func willDestroy() {
    willDestroyCalls += 1
  }

  func didStartListening(event: String) {
    startedListeningEvents.append(event)
  }

  func didStopListening(event: String) {
    stoppedListeningEvents.append(event)
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
    try runtime.eval("""
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
    try runtime.eval("""
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
    try runtime.eval("""
      module = expo.modules.LifecycleHooksModule
      module.addListener('eventA', () => {})
      module.addListener('eventB', () => {})
      module.removeAllListeners('eventB')
      """)
    #expect(module.startedListeningEvents == ["eventA", "eventB"])
    #expect(module.stoppedListeningEvents == ["eventB"])
  }
}
