// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

@Suite("JavaScriptRuntime")
@JavaScriptActor
struct JavaScriptRuntimeTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `has global object accessible`() {
    #expect(runtime.global != nil)
  }

  // MARK: - eval

  @Test
  func `eval returns undefined`() throws {
    let undefined = try runtime.eval("undefined")
    #expect(undefined.isUndefined() == true)
    #expect(undefined.kind == .undefined)
    #expect(undefined.isNull() == false)
    #expect(undefined.getRaw() == nil)
  }

  @Test
  func `eval returns null`() throws {
    let null = try runtime.eval("null")
    #expect(null.isNull() == true)
    #expect(null.kind == .null)
    #expect(null.getRaw() == nil)
  }

  @Test
  func `eval returns bool`() throws {
    let boolTrue = try runtime.eval("true")
    let boolFalse = try runtime.eval("false")
    #expect(boolTrue.isBool() == true)
    #expect(boolFalse.isBool() == true)
    #expect(boolTrue.kind == .bool)
    #expect(boolFalse.kind == .bool)
    #expect(try boolTrue.asBool() == true)
    #expect(try boolFalse.asBool() == false)
  }

  @Test
  func `eval returns number`() throws {
    let number = try runtime.eval("1.23")
    #expect(number.isNumber() == true)
    #expect(number.kind == .number)
    #expect(try number.asInt() == 1)
    #expect(try number.asDouble() == 1.23)
  }

  @Test
  func `eval returns string`() throws {
    let string = try runtime.eval("'foobar'")
    #expect(string.isString() == true)
    #expect(string.kind == .string)
    #expect(try string.asString() == "foobar")
  }

  @Test
  func `eval returns array`() throws {
    let array = try runtime.eval("(['foo', 'bar'])")
    #expect(array.isObject() == true)
    #expect(array.kind == .object)
    #expect(try array.asArray().map { try $0?.asString() } == ["foo", "bar"])
  }

  @Test
  func `eval returns dict`() throws {
    let dict1 = try runtime.eval("({ 'foo': 123 })")
    let dict2 = try runtime.eval("({ 'foo': 'bar' })")
    #expect(dict1.isObject() == true)
    #expect(dict2.isObject() == true)
    #expect(dict1.kind == .object)
    #expect(dict2.kind == .object)
    #expect(try dict1.asDict() as? [String: Int] == ["foo": 123])
    #expect(try dict2.asDict() as? [String: String] == ["foo": "bar"])
  }

  @Test
  func `eval returns function`() throws {
    let function = try runtime.eval("(function() {})")
    #expect(function.isObject() == true)
    #expect(function.isFunction() == true)
    #expect(function.kind == .function)
  }

  @Test
  func `eval returns symbol`() throws {
    let symbol = try runtime.eval("Symbol('foo')")
    #expect(symbol.isSymbol() == true)
    #expect(symbol.kind == .symbol)
  }

  @Test
  func `eval throws evaluation exception`() throws {
    #expect {
      try runtime.eval("foo")
    } throws: { error in
      guard let evalError = error as? JavaScriptEvalException else {
        return false
      }
      if runtime.global().hasProperty("HermesInternal") {
        return evalError.reason.contains("Property 'foo' doesn't exist")
      } else {
        return evalError.reason.contains("Can't find variable: foo")
      }
    }
  }
}
