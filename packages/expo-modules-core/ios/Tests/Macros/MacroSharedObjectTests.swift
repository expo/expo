// Copyright 2024-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

// MARK: - Test shared object and module

@Record
private struct MacroPoint {
  var x: Int = 0
  var y: Int = 0
}

@SharedObject
private final class MacroCounter: SharedObject {
  private var value: Int

  @JS
  init(value: Int) {
    self.value = value
  }

  @JS
  func increment(by amount: Int) -> Int {
    value += amount
    return value
  }

  @JS
  var current: Int {
    return value
  }

  // A settable stored property.
  @JS
  var label: String = ""

  // A `Record` argument and return.
  @JS
  func shift(by point: MacroPoint) -> MacroPoint {
    value += point.x + point.y
    return MacroPoint(x: point.x, y: value)
  }

  // A value-returning method with an omittable trailing optional, plus an optional return: omitting
  // the argument (or passing a negative limit) returns `nil`. Exercises the arity-branched `switch`
  // codegen for a value-returning method.
  @JS
  func clamp(to limit: Int? = nil) -> Int? {
    guard let limit, limit >= 0 else {
      return nil
    }
    value = min(value, limit)
    return value
  }

  // A `SharedObject` argument and return.
  @JS
  func added(to other: MacroCounter) -> MacroCounter {
    return MacroCounter(value: value + other.current)
  }

  // A throwing member.
  @JS
  func validate() throws {
    throw TestCodedException()
  }
}

@SharedObject("RenamedCounter")
private final class MacroNamedCounter: SharedObject {
  @JS
  init(label: String) {}

  @JS
  func ping() -> String {
    return "pong"
  }
}

/// Exposes `@JS` members but no `@JS init`, and the module registers it with no DSL
/// `Constructor`, so nothing can build its native instance from JavaScript.
@SharedObject
private final class MacroUnconstructableCounter: SharedObject {
  @JS
  func ping() -> String {
    return "pong"
  }
}

@ExpoModule(
  classes: [MacroCounter.self, MacroNamedCounter.self, MacroUnconstructableCounter.self])
private final class MacroSharedObjectModule: Module {}

@Suite("Macro shared object")
@JavaScriptActor
private struct MacroSharedObjectTests {
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

  // MARK: - Class exposure

  @Test
  func `class is exposed under the module by its name`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    #expect(try runtime.eval("typeof expo.modules.MacroSharedObjectModule.MacroCounter").asString() == "function")
  }

  @Test
  func `class name honors the @SharedObject argument`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    #expect(try runtime.eval("typeof expo.modules.MacroSharedObjectModule.RenamedCounter").asString() == "function")
    #expect(try runtime.eval("'MacroNamedCounter' in expo.modules.MacroSharedObjectModule").asBool() == false)
  }

  // MARK: - Construction

  @Test
  func `constructing a class that cannot build its native instance throws`() throws {
    // Both construction paths are skipped for such a class, so without the throw JavaScript would
    // get an object with no native instance and fail later, at the first member access.
    register(MacroSharedObjectModule(appContext: appContext))
    let threw = try runtime.eval(
      """
      (() => {
        try {
          new expo.modules.MacroSharedObjectModule.MacroUnconstructableCounter()
          return false
        } catch (error) {
          return String(error).includes('MacroUnconstructableCounter')
        }
      })()
      """)
    #expect(try threw.asBool())
  }

  @Test
  func `@JS init constructs the instance from JS arguments`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    let value = try runtime.eval(
      """
      object = new expo.modules.MacroSharedObjectModule.MacroCounter(7)
      object.current
      """)
    #expect(try value.asInt() == 7)
  }

  // MARK: - @JS methods

  @Test
  func `binds a @JS method on the prototype, unwrapping the receiver`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    let value = try runtime.eval(
      """
      object = new expo.modules.MacroSharedObjectModule.MacroCounter(10)
      object.increment(5)
      """)
    #expect(try value.asInt() == 15)
  }

  @Test
  func `method mutates the paired native instance across calls`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    let value = try runtime.eval(
      """
      object = new expo.modules.MacroSharedObjectModule.MacroCounter(0)
      object.increment(1)
      object.increment(2)
      object.increment(3)
      """)
    #expect(try value.asInt() == 6)
  }

  @Test
  func `honors the @SharedObject name override on a bound method`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    #expect(try runtime.eval("new expo.modules.MacroSharedObjectModule.RenamedCounter('x').ping()").asString() == "pong")
  }

  // MARK: - @JS properties

  @Test
  func `binds a @JS property on the prototype`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    let value = try runtime.eval(
      """
      object = new expo.modules.MacroSharedObjectModule.MacroCounter(42)
      object.current
      """)
    #expect(try value.asInt() == 42)
  }

  @Test
  func `binds a settable @JS property, decoding the assigned value`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    let value = try runtime.eval(
      """
      object = new expo.modules.MacroSharedObjectModule.MacroCounter(0)
      object.label = 'hello'
      object.label
      """)
    #expect(try value.asString() == "hello")
  }

  // MARK: - Non-primitive decode/encode

  @Test
  func `decodes and encodes a Record across a @JS method`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    let result = try runtime.eval(
      """
      object = new expo.modules.MacroSharedObjectModule.MacroCounter(10)
      object.shift({ x: 3, y: 4 })
      """).asObject()
    #expect(try result.getProperty("x").asInt() == 3)
    // value (10) + x (3) + y (4) = 17
    #expect(try result.getProperty("y").asInt() == 17)
  }

  @Test
  func `round-trips an optional return: value and null`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    let clamped = try runtime.eval(
      """
      object = new expo.modules.MacroSharedObjectModule.MacroCounter(100)
      object.clamp(40)
      """)
    #expect(try clamped.asInt() == 40)

    // A negative limit returns nil, which encodes as `null`.
    let passthrough = try runtime.eval("object.clamp(-1)")
    #expect(passthrough.isNull() == true)

    // Omitting the trailing argument hits the arity-0 branch and returns nil.
    let omitted = try runtime.eval("new expo.modules.MacroSharedObjectModule.MacroCounter(7).clamp()")
    #expect(omitted.isNull() == true)
  }

  @Test
  func `decodes and encodes another SharedObject across a @JS method`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    let value = try runtime.eval(
      """
      a = new expo.modules.MacroSharedObjectModule.MacroCounter(10)
      b = new expo.modules.MacroSharedObjectModule.MacroCounter(5)
      a.added(b).current
      """)
    #expect(try value.asInt() == 15)
  }

  // MARK: - Error propagation

  @Test
  func `a throwing @JS method surfaces a coded JS error`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    let code = try runtime.eval(
      """
      object = new expo.modules.MacroSharedObjectModule.MacroCounter(0)
      try { object.validate() } catch (error) { error.code }
      """)
    #expect(try code.asString() == "E_TEST_CODE")
  }

  // MARK: - Release

  // React Native deep-freezes view props in development, so a shared object passed as a prop is
  // frozen by the time its owner releases it.
  @Test
  func `release() releases the native object of a frozen JS object`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    let registrySizeBefore = appContext.sharedObjectRegistry.size
    let jsObject = try runtime.eval("object = new expo.modules.MacroSharedObjectModule.MacroCounter(1)").asObject()
    let nativeObject = try SharedObject.native(from: jsObject)
    try runtime.eval("Object.freeze(object); object.release()")
    #expect(nativeObject.sharedObjectId == 0)
    #expect(appContext.sharedObjectRegistry.size == registrySizeBefore)
  }

  @Test
  func `release() can be called again on a frozen JS object`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    try runtime.eval(
      """
      object = new expo.modules.MacroSharedObjectModule.MacroCounter(1)
      Object.freeze(object)
      object.release()
      object.release()
      """)
  }

  @Test
  func `a released frozen JS object no longer resolves to the native object`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    let code = try runtime.eval(
      """
      object = new expo.modules.MacroSharedObjectModule.MacroCounter(1)
      Object.freeze(object)
      object.release()
      try { object.increment(1); 'no error' } catch (error) { error.code }
      """)
    #expect(try code.asString() == "ERR_NATIVE_SHARED_OBJECT_NOT_FOUND")
  }

  @Test
  func `a released frozen JS object no longer receives events`() throws {
    register(MacroSharedObjectModule(appContext: appContext))
    let jsObject = try runtime.eval(
      """
      calls = 0
      object = new expo.modules.MacroSharedObjectModule.MacroCounter(1)
      object.addListener('ping', () => { calls += 1 })
      Object.freeze(object)
      """).asObject()
    let nativeObject = try SharedObject.native(from: jsObject)
    try runtime.eval("object.release()")
    nativeObject.emit(event: "ping")
    #expect(try runtime.eval("calls").asInt() == 0)
  }

  // MARK: - Alternate-runtime prototype

  @Test
  func `buildPrototype decorates the @JS members for alternate runtimes`() throws {
    register(MacroSharedObjectModule(appContext: appContext))

    // `buildPrototype` is how a SharedObject's proxy is rebuilt in an alternate runtime (e.g. a
    // worklet). The macro's `@JS` members aren't in the DSL `properties`/`functions`, so the
    // prototype must be decorated via `_decorateSharedObject` here too.
    let basePrototype = try runtime.eval("expo.SharedObject.prototype").asObject()
    let prototype = try MacroCounter._synthesizedClassDefinition().buildPrototype(
      in: runtime,
      appContext: appContext,
      basePrototype: basePrototype
    )
    // Read into plain values first; `#expect` can't capture the non-copyable `JavaScriptObject`.
    let hasMethod = prototype.hasProperty("increment")
    let hasProperty = prototype.hasProperty("current")
    #expect(hasMethod)
    #expect(hasProperty)
  }
}
