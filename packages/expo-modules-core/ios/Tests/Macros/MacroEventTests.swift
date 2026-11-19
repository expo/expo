// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Foundation
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

  @Event(.inline)
  var onTickedInline: (ProgressEvent) -> Void
}

/// Emits an inline module event when it's released, to check that the release hooks run without the
/// shared object registry lock.
@SharedObject
private final class MacroReleasingObject: SharedObject {
  @JS
  init(tag: Int) {}

  override func sharedObjectWillRelease() {
    guard let module = appContext?.moduleRegistry.get(moduleWithName: "MacroEmitter") as? MacroEmitter else {
      return
    }
    module.lastReleased = self
    module.onObjectReleased()
  }
}

@ExpoModule(classes: [MacroEmittingObject.self, MacroReleasingObject.self])
private final class MacroEmitter: Module {
  @Event(.inline)
  var onObjectReleased: () -> Void

  /// The last `MacroReleasingObject` whose release hook ran, which a listener can pass back to JS.
  var lastReleased: MacroReleasingObject?

  @JS
  func takeLastReleased() -> MacroReleasingObject? {
    return lastReleased
  }

  @Event
  var onProgress: (ProgressEvent) -> Void

  @Event
  var onDone: () -> Void

  @Event
  var onCount: (Int64) -> Void

  @Event
  var onTimestamp: (Date) -> Void

  @Event(.inline)
  var onProgressInline: (ProgressEvent) -> Void

  @Event(.blocking)
  var onDoneBlocking: () -> Void

  @Event("moveInline", .inline)
  var onMovedInline: ((x: Int, y: Int)) -> Void

  @Event(.blocking)
  var onMovedBlocking: ((x: Int, y: Int)) -> Void
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
  func `emits a no-payload event with undefined as the only argument`() throws {
    try runtime.eval("""
      globalThis.result = null
      expo.modules.MacroEmitter.addListener('done', (...args) => { globalThis.result = args.length + ':' + typeof args[0] })
      """)
    module.onDone()
    let result = try runtime.eval("globalThis.result").asString()
    #expect(result == "1:undefined")
  }

  @Test
  func `emits a 64-bit integer payload as a bigint`() throws {
    try runtime.eval("""
      globalThis.result = null
      expo.modules.MacroEmitter.addListener('count', payload => { globalThis.result = typeof payload + ':' + payload })
      """)
    module.onCount(42)
    let result = try runtime.eval("globalThis.result").asString()
    #expect(result == "bigint:42")
  }

  @Test
  func `emits a date payload as a JS Date`() throws {
    try runtime.eval("""
      globalThis.result = null
      expo.modules.MacroEmitter.addListener('timestamp', payload => {
        globalThis.result = Object.prototype.toString.call(payload) + ':' + (payload instanceof Date ? payload.getTime() : payload)
      })
      """)
    module.onTimestamp(Date(timeIntervalSince1970: 1_700_000_000))
    let result = try runtime.eval("globalThis.result").asString()
    #expect(result == "[object Date]:1700000000000")
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

  @Test
  func `emits an inline event with a payload`() throws {
    try runtime.eval("""
      globalThis.result = null
      expo.modules.MacroEmitter.addListener('progressInline', payload => { globalThis.result = payload.percent })
      """)
    module.onProgressInline(ProgressEvent(percent: 40))
    #expect(try runtime.eval("globalThis.result").asInt() == 40)
  }

  @Test
  func `emits a no-payload blocking event`() throws {
    try runtime.eval("""
      globalThis.result = null
      expo.modules.MacroEmitter.addListener('doneBlocking', (...args) => { globalThis.result = args.length + ':' + typeof args[0] })
      """)
    module.onDoneBlocking()
    #expect(try runtime.eval("globalThis.result").asString() == "1:undefined")
  }

  @Test
  func `emits an inline event with a tuple payload`() throws {
    try runtime.eval("""
      globalThis.result = null
      expo.modules.MacroEmitter.addListener('moveInline', payload => { globalThis.result = JSON.stringify(payload) })
      """)
    module.onMovedInline((x: 3, y: 4))
    #expect(try runtime.eval("globalThis.result").asString() == #"{"x":3,"y":4}"#)
  }

  @Test
  func `emits a blocking event with a tuple payload`() throws {
    try runtime.eval("""
      globalThis.result = null
      expo.modules.MacroEmitter.addListener('movedBlocking', payload => { globalThis.result = JSON.stringify(payload) })
      """)
    module.onMovedBlocking((x: 5, y: 6))
    #expect(try runtime.eval("globalThis.result").asString() == #"{"x":5,"y":6}"#)
  }

  @Test
  func `emits an inline event from a shared object`() throws {
    let object = MacroEmittingObject()
    let encoded = try MacroEmittingObject.encode(object, in: runtime)
    try runtime.global().setProperty("emittingObject", value: encoded)
    try runtime.eval("""
      globalThis.result = null
      emittingObject.addListener('tickedInline', payload => { globalThis.result = payload.percent })
      """)
    object.onTickedInline(ProgressEvent(percent: 60))
    #expect(try runtime.eval("globalThis.result").asInt() == 60)
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

/// A non-copyable payload, which `emitInline` and `emitBlocking` accept.
private struct UniqueTicket: ~Copyable, JavaScriptEncodable {
  let number: Int

  static func encode(_ value: consuming UniqueTicket, in runtime: borrowing JavaScriptRuntime) throws -> JavaScriptValue {
    return try Int.encode(value.number, in: runtime)
  }
}

/// Emits through `TestAppContext`, whose runtime has its own JavaScript thread, so an event that
/// runs inline can be told from a scheduled one. The test itself runs on another thread.
@Suite("Macro event dispatch")
@JavaScriptActor
private struct MacroEventDispatchTests {
  let appContext: AppContext
  let module: MacroEmitter
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() throws {
    appContext = TestAppContext()
    module = MacroEmitter(appContext: appContext)
    appContext.moduleRegistry.register(module: module, name: nil)
    let runtime = try appContext.runtime
    try runtime.execute {
      try runtime.eval("""
        globalThis.result = null
        expo.modules.MacroEmitter.addListener('progress', payload => { globalThis.result = payload.percent })
        expo.modules.MacroEmitter.addListener('progressInline', payload => { globalThis.result = payload.percent })
        expo.modules.MacroEmitter.addListener('doneBlocking', () => { globalThis.result = 1 })
        """)
    }
  }

  /// Reads `globalThis.result` on the JavaScript thread.
  private func result() throws -> Int? {
    let runtime = try runtime
    return try runtime.execute {
      let value = try runtime.eval("globalThis.result")
      return value.isNumber() ? try value.asInt() : nil
    }
  }

  @Test
  func `schedules an event without an option, also on the JavaScript thread`() async throws {
    let runtime = try runtime
    let module = module
    let resultInTask = try await runtime.execute {
      module.onProgress(ProgressEvent(percent: 10))
      let value = try runtime.eval("globalThis.result")
      return value.isNumber() ? try value.asInt() : nil
    }
    #expect(resultInTask == nil)
    try await expectEventually { try await self.result() == 10 }
  }

  @Test
  func `runs the listeners of an inline event before returning on the JavaScript thread`() throws {
    let runtime = try runtime
    let module = module
    let resultInTask = try runtime.execute {
      module.onProgressInline(ProgressEvent(percent: 20))
      let value = try runtime.eval("globalThis.result")
      return value.isNumber() ? try value.asInt() : nil
    }
    #expect(resultInTask == 20)
  }

  @Test
  func `schedules an inline event emitted from another thread without waiting`() throws {
    let runtime = try runtime
    let jsThreadReleased = DispatchSemaphore(value: 0)
    let module = module
    let emitted = DispatchSemaphore(value: 0)
    // Keeps the JavaScript thread busy, so an emit that waits for it would not return.
    runtime.schedule {
      jsThreadReleased.wait()
    }
    Thread {
      module.onProgressInline(ProgressEvent(percent: 30))
      emitted.signal()
    }.start()

    // A timed wait, so an emit that blocks fails the test instead of hanging it.
    #expect(emitted.wait(timeout: .now() + 5) == .success)
    jsThreadReleased.signal()
    // `result()` runs in a task that the JavaScript thread runs after the event, because the test
    // scheduler runs tasks in order. React Native's scheduler would run its immediate priority first.
    #expect(try result() == 30)
  }

  @Test
  func `blocks a blocking event emitted from another thread until the listeners ran`() throws {
    let runtime = try runtime
    let module = module
    let jsThreadReleased = DispatchSemaphore(value: 0)
    let emitted = DispatchSemaphore(value: 0)
    runtime.schedule {
      jsThreadReleased.wait()
    }
    // A thread of its own, so the emit starts at once even when the dispatch workers are busy.
    let started = DispatchSemaphore(value: 0)
    Thread {
      started.signal()
      module.onDoneBlocking()
      emitted.signal()
    }.start()
    started.wait()

    // The JavaScript thread is busy, so the emit can't return yet.
    #expect(emitted.wait(timeout: .now() + 0.1) == .timedOut)
    jsThreadReleased.signal()
    #expect(emitted.wait(timeout: .now() + 5) == .success)
    #expect(try result() == 1)
  }

  @Test
  func `emits a non-copyable payload inline on the JavaScript thread`() throws {
    let runtime = try runtime
    let module = module
    let resultInTask = try runtime.execute {
      try runtime.eval("expo.modules.MacroEmitter.addListener('ticket', number => { globalThis.result = number })")
      module.emitInline(event: "ticket", payload: UniqueTicket(number: 50))
      let value = try runtime.eval("globalThis.result")
      return value.isNumber() ? try value.asInt() : nil
    }
    #expect(resultInTask == 50)
  }

  @Test
  func `blocks a non-copyable blocking event emitted from another thread until the listeners ran`() throws {
    let runtime = try runtime
    let module = module
    try runtime.execute {
      try runtime.eval("expo.modules.MacroEmitter.addListener('ticket', number => { globalThis.result = number })")
    }
    let jsThreadReleased = DispatchSemaphore(value: 0)
    let emitted = DispatchSemaphore(value: 0)
    runtime.schedule {
      jsThreadReleased.wait()
    }
    let started = DispatchSemaphore(value: 0)
    Thread {
      started.signal()
      module.emitBlocking(event: "ticket", payload: UniqueTicket(number: 60))
      emitted.signal()
    }.start()
    started.wait()

    // The JavaScript thread is busy, so the emit can't return yet.
    #expect(emitted.wait(timeout: .now() + 0.1) == .timedOut)
    jsThreadReleased.signal()
    #expect(emitted.wait(timeout: .now() + 5) == .success)
    #expect(try result() == 60)
  }

  @Test
  func `runs the listeners of an inline event emitted from a release hook`() throws {
    let runtime = try runtime
    let created = try runtime.execute {
      try runtime.eval("""
        expo.modules.MacroEmitter.addListener('objectReleased', () => {
          // Pairs a new shared object, which takes the registry lock.
          globalThis.created = new expo.modules.MacroEmitter.MacroReleasingObject(2)
        })
        new expo.modules.MacroEmitter.MacroReleasingObject(1).release()
        globalThis.created instanceof expo.modules.MacroEmitter.MacroReleasingObject
        """).getBool()
    }
    #expect(created)
  }

  @Test
  func `pairs a shared object again from a listener of an inline event emitted from its release hook`() throws {
    let runtime = try runtime
    try runtime.execute {
      try runtime.eval("""
        expo.modules.MacroEmitter.addListener('objectReleased', () => {
          // Pairs the object that is being released with a new JS object.
          globalThis.paired = expo.modules.MacroEmitter.takeLastReleased()
        })
        new expo.modules.MacroEmitter.MacroReleasingObject(1).release()
        """)
    }
    // The release keeps the ID that the new pairing gave the object.
    let released = try #require(module.lastReleased)
    #expect(released.sharedObjectId != 0)
  }
}
