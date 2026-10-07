// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

/// Lending array elements and object properties out as `JavaScriptUnownedValue`s.
@Suite("Unowned elements and properties")
@JavaScriptActor
struct JavaScriptUnownedElementsTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `mapUnowned transforms every element in order`() throws {
    let array = try runtime.eval("[1, 'two', null, { four: 4 }]").getArray()
    let kinds = array.mapUnowned { element -> String in
      if element.isNumber() {
        return "number \(element.getDouble())"
      }
      if element.isString() {
        return "string \(element.getString())"
      }
      if element.isNull() {
        return "null"
      }
      return "object"
    }
    #expect(kinds == ["number 1.0", "string two", "null", "object"])
  }

  @Test
  func `mapUnowned of an empty array is empty`() throws {
    let array = try runtime.eval("[]").getArray()
    #expect(array.mapUnowned { $0.isNumber() }.isEmpty)
  }

  @Test
  func `mapUnowned rethrows the transform's error`() throws {
    let array = try runtime.eval("[1, 'two']").getArray()
    #expect(throws: (any Error).self) {
      _ = try array.mapUnowned { try $0.asDouble() }
    }
  }

  @Test
  func `withUnownedProperty lends the property and undefined for a missing one`() throws {
    let object = try runtime.eval("({ answer: 42, name: 'expo' })").getObject()
    #expect(object.withUnownedProperty("answer") { $0.getDouble() } == 42)
    #expect(object.withUnownedProperty("name") { $0.getString() } == "expo")
    #expect(object.withUnownedProperty("missing") { $0.isUndefined() })
  }

  @Test
  func `containers decode nested values through the unowned path`() throws {
    let value = try runtime.eval("[[1, 2], [3]]")
    #expect(try [[Int]].decode(value, in: runtime) == [[1, 2], [3]])
    let dictionary = try runtime.eval("({ a: [1], b: undefined, c: [2, 3] })")
    #expect(try [String: [Int]].decode(dictionary, in: runtime) == ["a": [1], "c": [2, 3]])
  }

  @Test
  func `an unowned value tells arrays apart and reads them`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(
      in: runtime,
      with: try runtime.eval("[1, 2, 3]"),
      try runtime.eval("({ length: 3 })"),
      try runtime.eval("new Uint8Array(3)"),
      try runtime.eval("3")
    )
    // `#expect` can't capture the `~Copyable` value, so compare the results instead.
    let isArray = (0..<4).map { buffer.unownedValue(at: $0).isArray() }
    #expect(isArray == [true, false, false, false])
    let array = buffer.unownedValue(at: 0).getArray(in: runtime)
    #expect(array.length == 3)
    #expect(array.mapUnowned { $0.getDouble() } == [1, 2, 3])
  }
}
