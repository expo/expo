// Copyright 2026-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("Callback")
@JavaScriptActor
struct CallbackTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  struct ProgressRecord: Record {
    @Field var percent: Double = 0.0
    @Field var stage: String = ""
  }

  enum Stage: String, Enumerable {
    case started
    case completed
  }

  init() {
    appContext = AppContext.create()

    appContext.moduleRegistry.register(holder: mockModuleHolder(appContext) {
      Name("TestModule")

      Function("fireInt") { (callback: Callback) in
        callback(42)
      }

      Function("fireThree") { (callback: Callback) in
        callback(1)
        callback(2)
        callback(3)
      }

      Function("fireRecord") { (callback: Callback) in
        let record = ProgressRecord()
        record.percent = 0.5
        record.stage = "downloading"
        callback(record)
      }

      Function("fireEnum") { (callback: Callback) in
        callback(Stage.completed)
      }

      Function("fireTwo") { (callback: Callback) in
        callback("Hello", 7)
      }

      Function("fireTwoCallbacks") { (onProgress: Callback, onDone: Callback) in
        onProgress(1)
        onDone(2)
      }

      Function("fireOptional") { (callback: Callback?) in
        callback?.callAsFunction("called")
      }

      Function("fireNone") { (callback: Callback) in
        callback()
      }

      Function("greet") { (name: String, callback: Callback) in
        callback("Hello, \(name)!")
      }

      AsyncFunction("fireFromBackground") { (callback: Callback) in
        DispatchQueue.global().sync {
          callback("done")
        }
      }
    })
  }

  @Test
  func `delivers one int`() async throws {
    try runtime.eval("expo.modules.TestModule.fireInt((value) => { globalThis.result = value })")
    try await expect(script: "globalThis.result", equals: "42")
  }

  @Test
  func `delivers multiple calls in order`() async throws {
    try runtime.eval("expo.modules.TestModule.fireThree((value) => { globalThis.result = (globalThis.result ?? []).concat(value) })")
    try await expect(script: "JSON.stringify(globalThis.result)", equals: "[1,2,3]")
  }

  @Test
  func `delivers record as object`() async throws {
    try runtime.eval("expo.modules.TestModule.fireRecord((p) => { globalThis.result = `${p.stage}:${p.percent}` })")
    try await expect(script: "globalThis.result", equals: "downloading:0.5")
  }

  @Test
  func `delivers enum as raw value`() async throws {
    try runtime.eval("expo.modules.TestModule.fireEnum((stage) => { globalThis.result = stage })")
    try await expect(script: "globalThis.result", equals: "completed")
  }

  @Test
  func `delivers two arguments`() async throws {
    try runtime.eval("expo.modules.TestModule.fireTwo((a, b) => { globalThis.result = `${a}-${b}` })")
    try await expect(script: "globalThis.result", equals: "Hello-7")
  }

  @Test
  func `accepts two callbacks`() async throws {
    let collect = "(value) => { globalThis.result = (globalThis.result ?? []).concat(value) }"
    try runtime.eval("expo.modules.TestModule.fireTwoCallbacks(\(collect), \(collect))")
    try await expect(script: "JSON.stringify(globalThis.result)", equals: "[1,2]")
  }

  @Test
  func `accepts an optional callback`() async throws {
    try runtime.eval("expo.modules.TestModule.fireOptional((value) => { globalThis.result = value })")
    try await expect(script: "globalThis.result", equals: "called")
  }

  @Test
  func `accepts an omitted optional callback`() async throws {
    try runtime.eval("expo.modules.TestModule.fireOptional(undefined)")
    try await expect(script: "typeof globalThis.result", equals: "undefined")
  }

  @Test
  func `delivers no arguments`() async throws {
    try runtime.eval("expo.modules.TestModule.fireNone((...args) => { globalThis.result = String(args.length) })")
    try await expect(script: "globalThis.result", equals: "0")
  }

  @Test
  func `works next to other arguments`() async throws {
    try runtime.eval("expo.modules.TestModule.greet('Expo', (greeting) => { globalThis.result = greeting })")
    try await expect(script: "globalThis.result", equals: "Hello, Expo!")
  }

  // `JavaScriptRuntime.init()` without a React scheduler runs scheduled tasks synchronously, so
  // these tests verify conversion and delivery rather than the hop itself. The JS-thread hop is
  // verified manually in native-component-list.
  @Test
  func `delivers from a background thread inside an async function`() async throws {
    try runtime.eval("expo.modules.TestModule.fireFromBackground((value) => { globalThis.result = value })")
    try await expect(script: "globalThis.result", equals: "done")
  }

  @Test
  func `rejects a non-function argument`() throws {
    #expect {
      try runtime.eval("expo.modules.TestModule.fireInt(42)")
    } throws: { error in
      String(describing: error).contains("Callback")
    }
  }

  @Test
  func `drops calls after the runtime is destroyed`() throws {
    final class Box: @unchecked Sendable {
      var callback: Callback?
    }
    let box = Box()
    let localAppContext = AppContext.create()
    localAppContext.moduleRegistry.register(holder: mockModuleHolder(localAppContext) {
      Name("Capture")
      Function("capture") { (callback: Callback) in
        box.callback = callback
      }
    })
    try localAppContext.runtime.eval("expo.modules.Capture.capture(() => {})")
    #expect(box.callback != nil)

    localAppContext.destroy()
    #expect(throws: Exceptions.RuntimeLost.self) {
      try localAppContext.runtime
    }

    // The runtime is gone, so both calls must return without throwing or crashing.
    box.callback?(1)
    box.callback?()
  }

  @Test
  func `deallocating after the runtime is destroyed does not crash`() throws {
    final class Box: @unchecked Sendable {
      var callback: Callback?
    }
    let box = Box()
    let localAppContext = AppContext.create()
    localAppContext.moduleRegistry.register(holder: mockModuleHolder(localAppContext) {
      Name("Capture")
      Function("capture") { (callback: Callback) in
        box.callback = callback
      }
    })
    try localAppContext.runtime.eval("expo.modules.Capture.capture(() => {})")
    #expect(box.callback != nil)

    localAppContext.destroy()

    // Exercises `deinit` against a dead runtime: it must not schedule or release anything.
    box.callback = nil
    #expect(box.callback == nil)
  }

  // MARK: - Helpers

  nonisolated private func expect(script: String, equals expected: String) async throws {
    try await expectEventually {
      guard let value = try? await self.runtime.eval(script) else {
        return false
      }
      if value.isString() {
        return try await value.asString() == expected
      }
      if value.isNumber() {
        return try await String(Int(value.asDouble())) == expected
      }
      return false
    }
  }
}
