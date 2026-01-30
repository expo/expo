// Copyright 2025-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesJSI

@Suite
struct JSRuntimeTests {
  @Test
  func `initializes`() {
    let _ = JavaScriptRuntime()
  }

  @Test
  func `returns global object`() {
    let global = JavaScriptRuntime().global()
    #expect(global.hasProperty("String") == true)
    #expect(global.hasProperty("Object") == true)
    #expect(global.hasProperty("RegExp") == true)
  }

  @Test
  func `creates object`() {
    let object = JavaScriptRuntime().createObject()
    #expect(object.getPropertyNames().count == 0)
    #expect(object.hasProperty("hasOwnProperty") == true)
    #expect(object.toValue().isObject() == true)
  }

  @Test
  func `creates object with prototype`() {
    let runtime = JavaScriptRuntime()
    let prototype = runtime.createObject()
    let function = runtime.createSyncFunction("test") { _, _ in .undefined }
    prototype.setProperty("test", function.toValue())
    let object = runtime.createObject(prototype: prototype)
    #expect(object.hasProperty("test") == true)
    #expect(object.getProperty("test").isFunction() == true)
  }

  @Test
  func `evals`() throws {
    let runtime = JavaScriptRuntime()
    let result = try runtime.eval("1 + 1")
    #expect(result.isNumber() == true)
    #expect(result.getInt() == 2)
  }
}
