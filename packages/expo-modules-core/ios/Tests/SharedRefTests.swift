// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("SharedRef")
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
