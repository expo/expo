// Copyright 2024-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

// MARK: - Test module

@Record
private struct ProgressEvent {
  var percent: Int = 0
}

@SharedObject
private final class MacroEmittingObject: SharedObject {
  @Event
  var onTicked: (ProgressEvent) -> Void
}

@ExpoModule(classes: [MacroEmittingObject.self])
private final class MacroEmitter: Module {
  @Event
  var onProgress: (ProgressEvent) -> Void

  @Event
  var onDone: () -> Void
}

@Suite("Macro event")
@JavaScriptActor
private struct MacroEventTests {
  let appContext: AppContext
  let module: MacroEmitter
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
    module = MacroEmitter(appContext: appContext)
    appContext.moduleRegistry.register(module: module, name: nil)
  }

  @Test
  func `emits an event with a payload to a JS listener`() async throws {
    try runtime.eval("""
      globalThis.result = null
      expo.modules.MacroEmitter.addListener('progress', payload => { globalThis.result = payload.percent })
      """)

    module.onProgress(ProgressEvent(percent: 75))

    try await expectResult(equals: 75)
  }

  @Test
  func `emits a no-payload event to a JS listener`() async throws {
    try runtime.eval("""
      globalThis.result = 0
      expo.modules.MacroEmitter.addListener('done', () => { globalThis.result = 1 })
      """)

    module.onDone()

    try await expectResult(equals: 1)
  }

  @Test
  func `emits an event from a shared object to a JS listener`() async throws {
    let object = MacroEmittingObject()
    // Encoding pairs the native object with a JS object and registers it; stash that on a global so a
    // listener can be attached from JS.
    let encoded = try MacroEmittingObject.encode(object, in: runtime)
    try runtime.global().setProperty("emittingObject", value: encoded)
    try runtime.eval("""
      globalThis.result = null
      emittingObject.addListener('ticked', payload => { globalThis.result = payload.percent })
      """)

    object.onTicked(ProgressEvent(percent: 30))

    try await expectResult(equals: 30)
  }

  nonisolated private func expectResult(equals expected: Int) async throws {
    try await expectEventually {
      guard let resultValue = try? await self.runtime.eval("globalThis.result") else {
        return false
      }
      guard resultValue.isNumber() else {
        return false
      }
      return try await resultValue.asInt() == expected
    }
  }
}
