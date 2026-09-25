// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
import Testing

@Suite("JavaScriptCodable+Any")
@JavaScriptActor
struct JavaScriptCodableAnyTests {
  let runtime = JavaScriptRuntime()

  // MARK: - decodeAny

  @Test
  func `decodes primitives into their native types`() throws {
    #expect(try JavaScriptValue.decodeAny(runtime.eval("true"), in: runtime) as? Bool == true)
    #expect(try JavaScriptValue.decodeAny(runtime.eval("1.5"), in: runtime) as? Double == 1.5)
    #expect(try JavaScriptValue.decodeAny(runtime.eval("'abc'"), in: runtime) as? String == "abc")
  }

  @Test
  func `decodes numbers as doubles`() throws {
    let decoded = try JavaScriptValue.decodeAny(runtime.eval("3"), in: runtime)
    #expect(decoded is Double)
    #expect(decoded as? Double == 3)
  }

  @Test
  func `decodes null and undefined as nil`() throws {
    #expect(try isNil(JavaScriptValue.decodeAny(runtime.eval("null"), in: runtime)))
    #expect(try isNil(JavaScriptValue.decodeAny(runtime.eval("undefined"), in: runtime)))
  }

  @Test
  func `decodes nested containers`() throws {
    let decoded = try JavaScriptValue.decodeAny(
      runtime.eval("({ list: [1, 'a', null], inner: { flag: false } })"),
      in: runtime
    )
    let dictionary = try #require(decoded as? [String: Any])
    let list = try #require(dictionary["list"] as? [Any])
    let inner = try #require(dictionary["inner"] as? [String: Any])
    #expect(list.count == 3)
    #expect(list[0] as? Double == 1)
    #expect(list[1] as? String == "a")
    #expect(isNil(list[2]))
    #expect(inner["flag"] as? Bool == false)
  }

  @Test
  func `decodes from a borrowed value`() throws {
    let buffer = try JavaScriptValuesBuffer.allocate(in: runtime, with: runtime.eval("({ a: 'x' })"))
    let decoded = try JavaScriptValue.decodeAny(buffer.unownedValue(at: 0), in: runtime)
    #expect((decoded as? [String: Any])?["a"] as? String == "x")
  }

  @Test
  func `decodes a bigint within the Int64 range as Int64`() throws {
    #expect(try JavaScriptValue.decodeAny(runtime.eval("42n"), in: runtime) as? Int64 == 42)
  }

  @Test
  func `throws for a bigint outside the Int64 range`() throws {
    #expect(throws: BigIntConversionError.self) {
      try JavaScriptValue.decodeAny(runtime.eval("2n ** 64n"), in: runtime)
    }
  }

  @Test
  func `throws TypeError for a function`() throws {
    #expect(throws: JavaScriptValue.TypeError.self) {
      try JavaScriptValue.decodeAny(runtime.eval("(() => {})"), in: runtime)
    }
  }

  @Test
  func `throws TypeError for a symbol`() throws {
    #expect(throws: JavaScriptValue.TypeError.self) {
      try JavaScriptValue.decodeAny(runtime.eval("Symbol('s')"), in: runtime)
    }
  }

  @Test
  func `throws TypeError for a function nested in a container`() throws {
    #expect(throws: JavaScriptValue.TypeError.self) {
      try JavaScriptValue.decodeAnyDictionary(runtime.eval("({ callback() {} })"), in: runtime)
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      try JavaScriptValue.decodeAnyArray(runtime.eval("[1, () => {}]"), in: runtime)
    }
  }

  @Test
  func `throws TypeError for a borrowed function`() throws {
    let buffer = try JavaScriptValuesBuffer.allocate(in: runtime, with: runtime.eval("(() => {})"))
    #expect(throws: JavaScriptValue.TypeError.self) {
      try JavaScriptValue.decodeAny(buffer.unownedValue(at: 0), in: runtime)
    }
  }

  @Test
  func `decodes a borrowed bigint as Int64`() throws {
    let buffer = try JavaScriptValuesBuffer.allocate(in: runtime, with: runtime.eval("7n"))
    let decoded = try JavaScriptValue.decodeAny(buffer.unownedValue(at: 0), in: runtime)
    #expect(decoded as? Int64 == 7)
  }

  // MARK: - decodeAnyArray

  @Test
  func `decodes an array of mixed values`() throws {
    let decoded = try JavaScriptValue.decodeAnyArray(runtime.eval("[true, 2, 'three', [4]]"), in: runtime)
    #expect(decoded.count == 4)
    #expect(decoded[0] as? Bool == true)
    #expect(decoded[1] as? Double == 2)
    #expect(decoded[2] as? String == "three")
    #expect((decoded[3] as? [Any])?.first as? Double == 4)
  }

  @Test
  func `decodes undefined array elements as nil`() throws {
    let decoded = try JavaScriptValue.decodeAnyArray(runtime.eval("[undefined, 1]"), in: runtime)
    #expect(decoded.count == 2)
    #expect(isNil(decoded[0]))
  }

  @Test
  func `arrayizes a non-array value`() throws {
    let decoded = try JavaScriptValue.decodeAnyArray(runtime.eval("'solo'"), in: runtime)
    #expect(decoded.count == 1)
    #expect(decoded[0] as? String == "solo")
  }

  @Test
  func `decodes an array from a borrowed value`() throws {
    let buffer = try JavaScriptValuesBuffer.allocate(in: runtime, with: runtime.eval("[1, 2]"))
    let decoded = try JavaScriptValue.decodeAnyArray(buffer.unownedValue(at: 0), in: runtime)
    #expect(decoded.compactMap { $0 as? Double } == [1, 2])
  }

  // MARK: - decodeAnyDictionary

  @Test
  func `decodes an object of mixed values`() throws {
    let decoded = try JavaScriptValue.decodeAnyDictionary(runtime.eval("({ a: 1, b: 'two', c: null })"), in: runtime)
    #expect(decoded.count == 3)
    #expect(decoded["a"] as? Double == 1)
    #expect(decoded["b"] as? String == "two")
    #expect(decoded.keys.contains("c"))
    #expect(isNil(decoded["c"]!))
  }

  @Test
  func `drops undefined properties`() throws {
    let decoded = try JavaScriptValue.decodeAnyDictionary(runtime.eval("({ a: undefined, b: 1 })"), in: runtime)
    #expect(Array(decoded.keys) == ["b"])
  }

  @Test
  func `throws TypeError for a non-object value`() throws {
    #expect(throws: JavaScriptValue.TypeError.self) {
      try JavaScriptValue.decodeAnyDictionary(runtime.eval("42"), in: runtime)
    }
  }

  @Test
  func `decodes an object from a borrowed value`() throws {
    let buffer = try JavaScriptValuesBuffer.allocate(in: runtime, with: runtime.eval("({ k: true })"))
    let decoded = try JavaScriptValue.decodeAnyDictionary(buffer.unownedValue(at: 0), in: runtime)
    #expect(decoded["k"] as? Bool == true)
  }

  // MARK: - decodeAny(_:as:in:)

  @Test
  func `decodes a nested free-form type`() throws {
    let decoded = try JavaScriptValue.decodeAny(runtime.eval("[[1], ['a', 'b']]"), as: [[Any]].self, in: runtime)
    #expect(decoded.count == 2)
    #expect(decoded[1].count == 2)
    #expect(decoded[1][0] as? String == "a")
  }

  @Test
  func `decodes null and undefined as nil for an optional type`() throws {
    #expect(try JavaScriptValue.decodeAny(runtime.eval("null"), as: [String: [Any]]?.self, in: runtime) == nil)
    #expect(try JavaScriptValue.decodeAny(runtime.eval("undefined"), as: [String: [Any]]?.self, in: runtime) == nil)
  }

  @Test
  func `decodes a present value for an optional type`() throws {
    let decoded = try JavaScriptValue.decodeAny(runtime.eval("({ a: [1] })"), as: [String: [Any]]?.self, in: runtime)
    #expect(decoded?["a"]?.first as? Double == 1)
  }

  @Test
  func `throws TypeError when the value doesn't match the type`() throws {
    #expect(throws: JavaScriptValue.TypeError.self) {
      try JavaScriptValue.decodeAny(runtime.eval("'text'"), as: [String: [Any]].self, in: runtime)
    }
    #expect(throws: JavaScriptValue.TypeError.self) {
      try JavaScriptValue.decodeAny(runtime.eval("null"), as: [[Any]].self, in: runtime)
    }
  }

  @Test
  func `decodes a nested null as nil for a nested optional`() throws {
    let dictionary = try JavaScriptValue.decodeAny(
      runtime.eval("({ a: null, b: [1] })"),
      as: [String: [Any]?].self,
      in: runtime
    )
    #expect(dictionary.keys.contains("a"))
    #expect(dictionary["a"]! == nil)
    #expect(dictionary["b"]??.first as? Double == 1)
    let list = try JavaScriptValue.decodeAny(runtime.eval("[null, 1]"), as: [Any?].self, in: runtime)
    #expect(list.count == 2)
    #expect(list[0] == nil)
    #expect(list[1] as? Double == 1)
  }

  // MARK: - encodeAny

  @Test
  func `encodes native primitives`() throws {
    #expect(try JavaScriptValue.encodeAny("abc", in: runtime).getString() == "abc")
    #expect(try JavaScriptValue.encodeAny(1.5, in: runtime).getDouble() == 1.5)
    #expect(try JavaScriptValue.encodeAny(true, in: runtime).getBool() == true)
    #expect(try JavaScriptValue.encodeAny(42, in: runtime).getInt() == 42)
  }

  @Test
  func `throws for an Int outside the safe-integer range, like Int.encode`() throws {
    #expect(throws: (any Error).self) {
      try JavaScriptValue.encodeAny(9_007_199_254_740_993, in: runtime)
    }
    #expect(throws: (any Error).self) {
      try JavaScriptValue.encodeAnyDictionary(["big": 9_007_199_254_740_993], in: runtime)
    }
  }

  @Test
  func `encodes boolean NSNumbers as booleans and other NSNumbers as numbers`() throws {
    let yes = try JavaScriptValue.encodeAny(NSNumber(value: true), in: runtime)
    let one = try JavaScriptValue.encodeAny(NSNumber(value: 1), in: runtime)
    #expect(yes.isBool())
    #expect(yes.getBool() == true)
    #expect(one.isNumber())
    #expect(one.getDouble() == 1)
  }

  @Test
  func `encodes nil and NSNull as null`() throws {
    let none: String? = nil
    #expect(try JavaScriptValue.encodeAny(none as Any, in: runtime).isNull())
    #expect(try JavaScriptValue.encodeAny(NSNull(), in: runtime).isNull())
  }

  @Test
  func `encodes a present optional as its wrapped value`() throws {
    let some: Any? = "wrapped"
    #expect(try JavaScriptValue.encodeAny(some as Any, in: runtime).getString() == "wrapped")
  }

  @Test
  func `encodes nested free-form containers`() throws {
    let value: [[Any]] = [[1, "a"], [["k": true] as [String: Any]]]
    let encoded = try JavaScriptValue.encodeAny(value, in: runtime)
    runtime.global().setProperty("encoded", value: encoded)
    #expect(try runtime.eval("JSON.stringify(encoded)").getString() == #"[[1,"a"],[{"k":true}]]"#)
  }

  @Test
  func `encodes JavaScriptEncodable values`() throws {
    let date = Date(timeIntervalSince1970: 1)
    let encoded = try JavaScriptValue.encodeAny(date, in: runtime)
    #expect(encoded.isObject())
    #expect(try JavaScriptValue.encodeAny([1, 2] as [Int], in: runtime).getArray().length == 2)
  }

  @Test
  func `round-trips a bigint through Int64`() throws {
    let decoded = try JavaScriptValue.decodeAny(runtime.eval("9007199254740993n"), in: runtime)
    let encoded = try JavaScriptValue.encodeAny(decoded, in: runtime)
    try #require(encoded.isBigInt())
    #expect(try encoded.getBigInt().asInt64() == 9_007_199_254_740_993)
  }

  @Test
  func `passes a JavaScriptValue through`() throws {
    let object = try runtime.eval("({ marker: 7 })")
    let encoded = try JavaScriptValue.encodeAny(object, in: runtime)
    #expect(encoded.getObject().getProperty("marker").getInt() == 7)
  }

  @Test
  func `throws for a value with no JavaScript representation`() throws {
    struct Opaque {}
    #expect(throws: JavaScriptValue.EncodingError.self) {
      try JavaScriptValue.encodeAny(Opaque(), in: runtime)
    }
  }

  // MARK: - encodeAnyArray / encodeAnyDictionary

  @Test
  func `encodes an array of mixed values`() throws {
    let encoded = try JavaScriptValue.encodeAnyArray([true, 2, "three", NSNull()], in: runtime)
    runtime.global().setProperty("encoded", value: encoded)
    #expect(try runtime.eval("JSON.stringify(encoded)").getString() == #"[true,2,"three",null]"#)
  }

  @Test
  func `encodes a dictionary of mixed values`() throws {
    let encoded = try JavaScriptValue.encodeAnyDictionary(["a": 1, "b": ["x", false] as [Any]], in: runtime)
    let object = encoded.getObject()
    #expect(object.getProperty("a").getInt() == 1)
    runtime.global().setProperty("encoded", value: object.getProperty("b"))
    #expect(try runtime.eval("JSON.stringify(encoded)").getString() == #"["x",false]"#)
  }

  @Test
  func `round-trips a dictionary through decode and encode`() throws {
    let decoded = try JavaScriptValue.decodeAnyDictionary(
      runtime.eval("({ n: 1.5, s: 's', l: [true, null], o: { z: 0 } })"),
      in: runtime
    )
    let encoded = try JavaScriptValue.encodeAnyDictionary(decoded, in: runtime)
    runtime.global().setProperty("encoded", value: encoded)
    #expect(
      try runtime.eval("JSON.stringify(encoded, ['l', 'n', 'o', 's', 'z'])").getString()
        == #"{"l":[true,null],"n":1.5,"o":{"z":0},"s":"s"}"#
    )
  }
}

/// True when a free-form value is `nil`, looking through any optionals it's boxed in (a decoded
/// `null` is a `nil` boxed in `Any`, which `== nil` doesn't see).
private func isNil(_ value: Any) -> Bool {
  let mirror = Mirror(reflecting: value)
  guard mirror.displayStyle == .optional else {
    return false
  }
  guard let wrapped = mirror.children.first else {
    return true
  }
  return isNil(wrapped.value)
}
