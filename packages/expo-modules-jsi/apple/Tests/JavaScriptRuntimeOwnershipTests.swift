// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

/// `belongs(to:)` of the JS types. The types are `~Copyable`, so the results are stored before `#expect`, which would
/// capture its operands.
@Suite
@JavaScriptActor
struct JavaScriptRuntimeOwnershipTests {
  let runtime = JavaScriptRuntime()
  let otherRuntime = JavaScriptRuntime()

  @Test
  func `a value belongs only to the runtime that created it`() throws {
    let value = try runtime.eval("'text'")
    let belongsToRuntime = value.belongs(to: runtime)
    let belongsToOtherRuntime = value.belongs(to: otherRuntime)
    #expect(belongsToRuntime == true)
    #expect(belongsToOtherRuntime == false)
  }

  @Test
  func `a value created without a runtime belongs to every runtime`() {
    let undefinedBelongs = JavaScriptValue.undefined().belongs(to: runtime)
    let numberBelongs = JavaScriptValue.number(1).belongs(to: otherRuntime)
    #expect(undefinedBelongs == true)
    #expect(numberBelongs == true)
  }

  @Test
  func `an object belongs only to the runtime that created it`() {
    let object = runtime.createObject()
    let belongsToRuntime = object.belongs(to: runtime)
    let belongsToOtherRuntime = object.belongs(to: otherRuntime)
    #expect(belongsToRuntime == true)
    #expect(belongsToOtherRuntime == false)
  }

  @Test
  func `an array belongs only to the runtime that created it`() {
    let array = runtime.createArray(length: 1)
    let belongsToRuntime = array.belongs(to: runtime)
    let belongsToOtherRuntime = array.belongs(to: otherRuntime)
    #expect(belongsToRuntime == true)
    #expect(belongsToOtherRuntime == false)
  }

  @Test
  func `a function belongs only to the runtime that created it`() throws {
    let function = try runtime.eval("(() => 1)").getFunction()
    let belongsToRuntime = function.belongs(to: runtime)
    let belongsToOtherRuntime = function.belongs(to: otherRuntime)
    #expect(belongsToRuntime == true)
    #expect(belongsToOtherRuntime == false)
  }

  @Test
  func `a typed array belongs only to the runtime that created it`() throws {
    let typedArray = try runtime.eval("new Uint8Array(1)").getTypedArray()
    let belongsToRuntime = typedArray.belongs(to: runtime)
    let belongsToOtherRuntime = typedArray.belongs(to: otherRuntime)
    #expect(belongsToRuntime == true)
    #expect(belongsToOtherRuntime == false)
  }

  @Test
  func `an array buffer belongs only to the runtime that created it`() {
    let arrayBuffer = runtime.createArrayBuffer(size: 8)
    let belongsToRuntime = arrayBuffer.belongs(to: runtime)
    let belongsToOtherRuntime = arrayBuffer.belongs(to: otherRuntime)
    #expect(belongsToRuntime == true)
    #expect(belongsToOtherRuntime == false)
  }

  @Test
  func `a BigInt belongs only to the runtime that created it`() {
    let bigInt = JavaScriptBigInt(runtime, fromInt64: 1)
    let belongsToRuntime = bigInt.belongs(to: runtime)
    let belongsToOtherRuntime = bigInt.belongs(to: otherRuntime)
    #expect(belongsToRuntime == true)
    #expect(belongsToOtherRuntime == false)
  }

  @Test
  func `a symbol belongs only to the runtime that created it`() throws {
    let symbol = try runtime.eval("Symbol('tag')").asSymbol()
    let belongsToRuntime = symbol.belongs(to: runtime)
    let belongsToOtherRuntime = symbol.belongs(to: otherRuntime)
    #expect(belongsToRuntime == true)
    #expect(belongsToOtherRuntime == false)
  }

  @Test
  func `a weak object belongs only to the runtime that created it`() {
    let object = runtime.createObject()
    let weakObject = JavaScriptWeakObject(runtime, object)
    let belongsToRuntime = weakObject.belongs(to: runtime)
    let belongsToOtherRuntime = weakObject.belongs(to: otherRuntime)
    #expect(belongsToRuntime == true)
    #expect(belongsToOtherRuntime == false)
  }

  @Test
  func `a property name belongs only to the runtime that created it`() {
    let propName = JavaScriptPropNameID(runtime, string: "length")
    let belongsToRuntime = propName.belongs(to: runtime)
    let belongsToOtherRuntime = propName.belongs(to: otherRuntime)
    #expect(belongsToRuntime == true)
    #expect(belongsToOtherRuntime == false)
  }
}
