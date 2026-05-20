// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("SharedObject")
@JavaScriptActor
struct SharedObjectTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
    appContext.moduleRegistry.register(moduleType: SharedObjectModule.self, name: nil)
  }

  // MARK: - Base JS class

  @Test
  func `base class exists`() throws {
    let baseSharedObjectClass = try runtime.eval("expo.SharedObject")
    #expect(baseSharedObjectClass.kind == .function)
  }

  @Test
  func `has release function in prototype`() throws {
    let releaseFunction = try runtime.eval("expo.SharedObject.prototype.release")
    #expect(releaseFunction.kind == .function)
  }

  @Test
  func `base class initializes`() throws {
    let sharedObject = try runtime.eval("new expo.SharedObject()")
    #expect(sharedObject.kind == .object)
  }

  @Test
  func `base class does not register`() throws {
    let registrySizeBefore = appContext.sharedObjectRegistry.size
    try runtime.eval("new expo.SharedObject()")
    #expect(appContext.sharedObjectRegistry.size == registrySizeBefore)
  }

  @Test
  func `inherits from EventEmitter`() throws {
    let isEventEmitter = try runtime.eval("new expo.SharedObject() instanceof expo.EventEmitter")
    #expect(isEventEmitter.kind == .bool)
    #expect(try isEventEmitter.asBool() == true)
  }

  // MARK: - Concrete JS class

  @Test
  func `concrete class exists`() throws {
    let sharedObjectClass = try runtime.eval("expo.modules.SharedObjectModule.SharedObjectExample")
    #expect(sharedObjectClass.kind == .function)
  }

  @Test
  func `has base class prototype`() throws {
    let hasBaseClassPrototype = try runtime.eval("expo.modules.SharedObjectModule.SharedObjectExample.prototype instanceof expo.SharedObject")
    #expect(hasBaseClassPrototype.kind == .bool)
    #expect(try hasBaseClassPrototype.asBool() == true)
  }

  @Test
  func `creates new instance`() throws {
    let sharedObject = try runtime.eval("new expo.modules.SharedObjectModule.SharedObjectExample()")
    #expect(sharedObject.kind == .object)
  }

  @Test
  func `registers`() throws {
    let registrySizeBefore = appContext.sharedObjectRegistry.size
    try runtime.eval("new expo.modules.SharedObjectModule.SharedObjectExample()")
    #expect(appContext.sharedObjectRegistry.size == registrySizeBefore + 1)
  }

  @Test
  func `is instance of`() throws {
    let isInstanceOf = try runtime.eval([
      "sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()",
      "sharedObject instanceof expo.modules.SharedObjectModule.SharedObjectExample"
    ])
    #expect(isInstanceOf.kind == .bool)
    #expect(try isInstanceOf.asBool() == true)
  }

  @Test
  func `is instance of base class`() throws {
    let isInstanceOfBaseClass = try runtime.eval([
      "sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()",
      "sharedObject instanceof expo.SharedObject"
    ])
    #expect(isInstanceOfBaseClass.kind == .bool)
    #expect(try isInstanceOfBaseClass.asBool() == true)
  }

  @Test
  func `has function from base class`() throws {
    let releaseFunction = try runtime.eval([
      "sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()",
      "sharedObject.release"
    ])
    #expect(releaseFunction.kind == .function)
  }

  @Test
  func `returns this`() throws {
    let isReturningItself = try runtime.eval([
      "sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()",
      "sharedObject === sharedObject.returnThis()"
    ])
    #expect(isReturningItself.kind == .bool)
    #expect(try isReturningItself.asBool() == true)
  }

  @Test
  func `releases the native object when JS reference is garbage-collected`() throws {
    let registrySizeBefore = appContext.sharedObjectRegistry.size
    try runtime.eval("(() => { new expo.modules.SharedObjectModule.SharedObjectExample() })()")
    try runtime.eval("gc() && gc() && gc()")
    #expect(appContext.sharedObjectRegistry.size == registrySizeBefore)
  }

  // MARK: - Native object

  @Test
  func `emits events`() throws {
    // Create the shared object
    let jsObject = try runtime
      .eval("sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()")
      .asObject()

    try runtime.eval(
      """
      result = null;
      sharedObject.addListener('test event', (payload) => { result = payload });      
      """
    )

    let nativeObject = appContext.sharedObjectRegistry.toNativeObject(jsObject)

    struct EventPayload: Record {
      @Field var number: Int = 123
      @Field var string: String = "test"
      @Field var boolean: Bool = true
    }

    nativeObject?.emit(event: "test event", payload: EventPayload())

    let result = try runtime.eval("result").asObject()

    #expect(try result.getProperty("number").asInt() == 123)
    #expect(try result.getProperty("string").asString() == "test")
    #expect(try result.getProperty("boolean").asBool() == true)
  }

  @Test
  func `emits events with no payload`() throws {
    let jsObject = try runtime
      .eval("sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()")
      .asObject()

    try runtime.eval(
      """
      callCount = 0;
      receivedPayload = 'not called';
      sharedObject.addListener('ping', (payload) => { callCount += 1; receivedPayload = payload });      
      """
    )

    let nativeObject = appContext.sharedObjectRegistry.toNativeObject(jsObject)
    nativeObject?.emit(event: "ping")

    #expect(try runtime.eval("callCount").asInt() == 1)
    #expect(try runtime.eval("receivedPayload").isUndefined() == true)
  }

  @Test
  func `emits events with a pre-converted JavaScriptValue payload`() throws {
    let jsObject = try runtime
      .eval("sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()")
      .asObject()

    try runtime.eval(
      """
      result = null;
      sharedObject.addListener('test event', (payload) => { result = payload });      
      """
    )

    let nativeObject = appContext.sharedObjectRegistry.toNativeObject(jsObject)

    let prebuiltPayload = try runtime.eval("({ kind: 'prebuilt', count: 7 })")
    nativeObject?.emit(event: "test event", payload: prebuiltPayload)

    let result = try runtime.eval("result").asObject()
    #expect(try result.getProperty("kind").asString() == "prebuilt")
    #expect(try result.getProperty("count").asInt() == 7)
  }

  @Test
  func `emits primitive payloads`() throws {
    let jsObject = try runtime
      .eval("sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()")
      .asObject()

    try runtime.eval(
      """
      results = [];
      sharedObject.addListener('primitive', (payload) => { results.push(payload) });
      """
    )

    let nativeObject = appContext.sharedObjectRegistry.toNativeObject(jsObject)
    nativeObject?.emit(event: "primitive", payload: 42)
    nativeObject?.emit(event: "primitive", payload: "hello")
    nativeObject?.emit(event: "primitive", payload: true)

    #expect(try runtime.eval("results.length").asInt() == 3)
    #expect(try runtime.eval("results[0]").asInt() == 42)
    #expect(try runtime.eval("results[1]").asString() == "hello")
    #expect(try runtime.eval("results[2]").asBool() == true)
  }

  @Test
  func `does not crash when emitting from a shared object not associated with a JS object`() throws {
    let detached = SharedObjectExample()
    detached.appContext = appContext

    // Not registered in `sharedObjectRegistry`, so `getJavaScriptValue()` returns nil and the
    // defensive branches in the public `emit` overloads should log and return cleanly.
    detached.emit(event: "ignored")
    detached.emit(event: "ignored", payload: ["key": "value"])
    detached.emit(event: "ignored", payload: .undefined)
  }

  @Test
  func `emits NativeArrayBuffer`() throws {
    let jsObject = try runtime
      .eval("sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()")
      .asObject()

    try runtime.eval([
      "result = null",
      "sharedObject.addListener('buffer event', (payload) => { result = payload })"
    ])

    let nativeObject = appContext.sharedObjectRegistry.toNativeObject(jsObject)

    let nativeBuffer = NativeArrayBuffer.allocate(size: 16, initializeToZero: false)
    nativeBuffer.withUnsafeBytes { raw in
      let mutable = UnsafeMutableRawPointer(mutating: raw.baseAddress!)
      for index in 0..<16 {
        mutable.storeBytes(of: UInt8(index + 1), toByteOffset: index, as: UInt8.self)
      }
    }

    let payload: [String: Any] = [
      "data": nativeBuffer,
      "length": 16
    ]

    nativeObject?.emit(event: "buffer event", payload: payload)

    let resultValue = try runtime.eval("result")
    #expect(!resultValue.isNull() && !resultValue.isUndefined())

    let result = try resultValue.asObject()
    let dataProperty = result.getProperty("data")

    #expect(dataProperty.isArrayBuffer())
    #expect(try result.getProperty("length").asInt() == 16)

    let firstByte = try runtime.eval("new Uint8Array(result.data)[0]").asInt()
    let lastByte = try runtime.eval("new Uint8Array(result.data)[15]").asInt()
    #expect(firstByte == 1)
    #expect(lastByte == 16)
  }
}

// MARK: - Test Helpers

private class SharedObjectModule: Module {
  public func definition() -> ModuleDefinition {
    Class(SharedObjectExample.self) {
      Constructor {
        return SharedObjectExample()
      }
      Function("returnThis") { (this: SharedObjectExample) -> SharedObjectExample in
        return this
      }
    }
  }
}

private final class SharedObjectExample: SharedObject {}
