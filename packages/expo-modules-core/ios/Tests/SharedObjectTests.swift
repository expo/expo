// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("SharedObject")
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

  // MARK: - Native object

  @Test
  @MainActor
  func `emits events`() throws {
    // Create the shared object
    let jsObject = try runtime
      .eval("sharedObject = new expo.modules.SharedObjectModule.SharedObjectExample()")
      .asObject()

    // Add a listener that adds three arguments
    try runtime.eval([
      "result = null",
      "sharedObject.addListener('test event', (number, string, record) => { result = { number, string, record } })"
    ])

    // Get the native instance
    let nativeObject = appContext.sharedObjectRegistry.toNativeObject(jsObject)

    struct EventRecord: Record {
      @Field var boolean: Bool = true
    }

    // Emit an event from the native object to JS
    nativeObject?.emit(event: "test event", arguments: 123, "test", EventRecord())

    // Check the value that is set by the listener
    let result = try runtime.eval("result").asObject()

    #expect(try result.getProperty("number").asInt() == 123)
    #expect(try result.getProperty("string").asString() == "test")
    #expect(try result.getProperty("record").asObject().getProperty("boolean").asBool() == true)
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
