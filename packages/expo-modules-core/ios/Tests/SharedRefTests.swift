// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Testing

@testable import ExpoModulesCore

@Suite("SharedRef")
@JavaScriptActor
struct SharedRefTests {
  let appContext: AppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = AppContext.create()
    appContext.moduleRegistry.register(moduleType: FirstModule.self, name: nil)
    appContext.moduleRegistry.register(moduleType: SecondModule.self, name: nil)
  }

  @Test
  func `is a shared object`() {
    #expect(SharedRef<UIImage>.self is SharedObject.Type)
  }

  @Test
  func `has dynamic type for shared objects`() {
    let dynamicType = ~SharedRef<UIImage>.self
    #expect(dynamicType is DynamicSharedObjectType == true)
  }

  @Test
  func `creates shared data`() throws {
    let result = try runtime.eval("expo.modules.FirstModule.createSharedData('\(sharedDataString)')")
    #expect(result.kind == .object)
  }

  @Test
  func `shares Data object`() throws {
    let result = try runtime.eval([
      "sharedData = expo.modules.FirstModule.createSharedData('\(sharedDataString)')",
      "expo.modules.SecondModule.stringFromSharedData(sharedData)"
    ])

    #expect(result.kind == .string)
    #expect(try result.asString() == sharedDataString)
  }

  @Test
  func `has native ref type`() throws {
    let result = try runtime.eval("expo.modules.FirstModule.createSharedString().nativeRefType")

    #expect(result.kind == .string)
    #expect(try result.asString() == "string")
  }
}

@Suite("SharedRef in an attached runtime")
@JavaScriptActor
struct SharedRefInAttachedRuntimeTests {
  let appContext: TestAppContext
  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  init() {
    appContext = TestAppContext()
    appContext.moduleRegistry.register(moduleType: SharedStringModule.self, name: nil)
  }

  /// Creates a shared string in the main runtime, resolves it in an attached runtime as the `sharedString` global, and
  /// returns the attached runtime.
  private func resolveSharedString() throws -> JavaScriptRuntime {
    let id = try runtime.eval(
      """
      sharedString = expo.modules.SharedStringModule.createSharedString()
      sharedString.__expo_shared_object_id__
      """).asInt()
    let attachedRuntime = try appContext.addRuntime()
    try attachedRuntime.eval("sharedString = expo.SharedObject.__resolveInWorklet(\(id))")
    return attachedRuntime
  }

  @Test
  func `is an instance of SharedRef`() throws {
    let attachedRuntime = try resolveSharedString()
    #expect(try attachedRuntime.eval("sharedString instanceof expo.SharedRef").getBool())
  }

  @Test
  func `has native ref type`() throws {
    let attachedRuntime = try resolveSharedString()
    #expect(try attachedRuntime.eval("sharedString.nativeRefType").asString() == "string")
  }

  @Test
  func `returns a shared ref without the Class definition`() throws {
    let appContext = self.appContext
    let attachedRuntime = try appContext.addRuntime()
    try attachedRuntime.execute {
      let jsObject = try appContext.javaScriptObject(for: SharedRef<Data>(Data()), in: attachedRuntime)
      attachedRuntime.global().setProperty("sharedData", value: jsObject.asValue())
    }
    #expect(try attachedRuntime.eval("sharedData instanceof expo.SharedRef").getBool())
  }
}

// MARK: - Test Helpers

private let sharedDataString = "I can be shared among independent modules"

private class SharedString: SharedRef<String> {
  override var nativeRefType: String {
    get {
      "string"
    }
  }
}

private class FirstModule: Module {
  public func definition() -> ModuleDefinition {
    Function("createSharedData") { (string: String) -> SharedRef<Data> in
      let data = Data(string.utf8)
      return SharedRef<Data>(data)
    }

    Function("createSharedString") {
      SharedString("string")
    }
  }
}

private class SecondModule: Module {
  public func definition() -> ModuleDefinition {
    Function("stringFromSharedData") { (data: SharedRef<Data>) -> String in
      return String(decoding: data.ref, as: UTF8.self)
    }
  }
}

private class SharedStringModule: Module {
  public func definition() -> ModuleDefinition {
    Class(SharedString.self) {}

    Function("createSharedString") {
      SharedString("string")
    }
  }
}
