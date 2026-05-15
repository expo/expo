// Copyright 2026-present 650 Industries. All rights reserved.

import CoreGraphics
import Foundation
import Testing
import ExpoModulesJSI

@testable import ExpoModulesCore

@Suite("JSValueEncoder")
@JavaScriptActor
struct JSValueEncoderTests {
  let appContext = AppContext.create()

  private func encode<ValueType: Encodable>(_ value: ValueType) throws -> JavaScriptValue {
    let encoder = try JSValueEncoder(appContext: appContext)
    try value.encode(to: encoder)
    return encoder.value
  }

  // MARK: - Primitives in single-value container

  @Test
  func `encodes a string`() throws {
    #expect(try encode("expo").getString() == "expo")
  }

  @Test
  func `encodes an int`() throws {
    #expect(try encode(42).getInt() == 42)
  }

  @Test
  func `encodes a double`() throws {
    #expect(try encode(3.5).getDouble() == 3.5)
  }

  @Test
  func `encodes a bool`() throws {
    #expect(try encode(true).getBool() == true)
  }

  @Test
  func `encodes a top-level nil optional as null`() throws {
    let value: String? = nil
    #expect(try encode(value).isNull() == true)
  }

  @Test
  func `encodes a top-level present optional as the wrapped value`() throws {
    let value: String? = "expo"
    #expect(try encode(value).getString() == "expo")
  }

  // MARK: - Plain Encodable struct

  @Test
  func `encodes a flat struct`() throws {
    struct Point: Encodable {
      let x: Int
      let y: Int
    }
    let result = try encode(Point(x: 3, y: 4)).getObject()

    #expect(result.getProperty("x").getInt() == 3)
    #expect(result.getProperty("y").getInt() == 4)
    #expect(result.getPropertyNames().count == 2)
  }

  // MARK: - Nested keyed container

  @Test
  func `encodes a nested struct using a nested keyed container`() throws {
    struct Inner: Encodable {
      let label: String
    }
    struct Outer: Encodable {
      let id: Int
      let inner: Inner
    }

    let result = try encode(Outer(id: 1, inner: Inner(label: "hello"))).getObject()

    #expect(result.getProperty("id").getInt() == 1)
    #expect(result.getPropertyAsObject("inner").getProperty("label").getString() == "hello")
  }

  // MARK: - Arrays

  @Test
  func `encodes an array of primitives`() throws {
    let array = try encode([10, 20, 30]).getArray()

    #expect(array.length == 3)
    #expect(try array.getValue(at: 0).getInt() == 10)
    #expect(try array.getValue(at: 2).getInt() == 30)
  }

  @Test
  func `encodes a struct field that is an array of structs`() throws {
    struct Item: Encodable {
      let value: Int
    }
    struct List: Encodable {
      let items: [Item]
    }

    let result = try encode(List(items: [Item(value: 1), Item(value: 2), Item(value: 3)])).getObject()
    let items = result.getProperty("items").getArray()

    #expect(items.length == 3)
    #expect(try items.getValue(at: 0).getObject().getProperty("value").getInt() == 1)
    #expect(try items.getValue(at: 2).getObject().getProperty("value").getInt() == 3)
  }

  // MARK: - Dictionaries

  @Test
  func `encodes a string-keyed dictionary field`() throws {
    struct Wrapper: Encodable {
      let counts: [String: Int]
    }
    let result = try encode(Wrapper(counts: ["a": 1, "b": 2])).getObject()
    let counts = result.getPropertyAsObject("counts")

    #expect(counts.getProperty("a").getInt() == 1)
    #expect(counts.getProperty("b").getInt() == 2)
  }

  // MARK: - Optionals

  @Test
  func `encodes a present optional field`() throws {
    struct Wrapper: Encodable {
      let label: String?
    }
    let result = try encode(Wrapper(label: "present")).getObject()

    #expect(result.getProperty("label").getString() == "present")
  }

  @Test
  func `encodes a nil optional field as null`() throws {
    struct Wrapper: Encodable {
      let label: String?
    }
    let result = try encode(Wrapper(label: nil)).getObject()

    #expect(result.getProperty("label").isNull() == true)
  }

  // MARK: - RawRepresentable enums

  @Test
  func `encodes a string-backed enum field as its raw value`() throws {
    enum Direction: String, Encodable {
      case north
      case south
    }
    struct Wrapper: Encodable {
      let direction: Direction
    }

    let result = try encode(Wrapper(direction: .north)).getObject()
    #expect(result.getProperty("direction").getString() == "north")
  }

  @Test
  func `encodes an int-backed enum field as its raw value`() throws {
    enum Code: Int, Encodable {
      case ok = 200
      case notFound = 404
    }
    struct Wrapper: Encodable {
      let code: Code
    }

    let result = try encode(Wrapper(code: .notFound)).getObject()
    #expect(result.getProperty("code").getInt() == 404)
  }

  // MARK: - Unkeyed container with mixed nesting

  @Test
  func `encodes an array with nested objects using an unkeyed container`() throws {
    struct Inner: Encodable {
      let n: Int
    }
    struct Holder: Encodable {
      let entries: [Inner]
    }

    let result = try encode(Holder(entries: (0..<5).map { Inner(n: $0 * 10) })).getObject()
    let entries = result.getProperty("entries").getArray()

    #expect(entries.length == 5)
    for index in 0..<5 {
      #expect(try entries.getValue(at: index).getObject().getProperty("n").getInt() == index * 10)
    }
  }

  // MARK: - Edge cases

  @Test
  func `encodes an empty array`() throws {
    let array = try encode([Int]()).getArray()
    #expect(array.length == 0)
  }

  @Test
  func `encodes an empty struct`() throws {
    struct Empty: Encodable {}
    let result = try encode(Empty()).getObject()
    #expect(result.getPropertyNames().isEmpty == true)
  }

  @Test
  func `encodes a nested array of arrays`() throws {
    let outer = try encode([[1, 2], [3, 4, 5]]).getArray()

    #expect(outer.length == 2)

    let first = try outer.getValue(at: 0).getArray()
    #expect(first.length == 2)
    #expect(try first.getValue(at: 0).getInt() == 1)
    #expect(try first.getValue(at: 1).getInt() == 2)

    let second = try outer.getValue(at: 1).getArray()
    #expect(second.length == 3)
    #expect(try second.getValue(at: 2).getInt() == 5)
  }

  @Test
  func `emits null for every primitive nil optional field`() throws {
    struct AllNils: Encodable {
      let aBool: Bool?
      let aString: String?
      let aDouble: Double?
      let aFloat: Float?
      let aInt: Int?
      let aInt8: Int8?
      let aInt16: Int16?
      let aInt32: Int32?
      let aInt64: Int64?
      let aUInt: UInt?
      let aUInt8: UInt8?
      let aUInt16: UInt16?
      let aUInt32: UInt32?
      let aUInt64: UInt64?

      init() {
        self.aBool = nil
        self.aString = nil
        self.aDouble = nil
        self.aFloat = nil
        self.aInt = nil
        self.aInt8 = nil
        self.aInt16 = nil
        self.aInt32 = nil
        self.aInt64 = nil
        self.aUInt = nil
        self.aUInt8 = nil
        self.aUInt16 = nil
        self.aUInt32 = nil
        self.aUInt64 = nil
      }
    }

    let result = try encode(AllNils()).getObject()
    let propertyNames = ["aBool", "aString", "aDouble", "aFloat", "aInt", "aInt8", "aInt16", "aInt32", "aInt64", "aUInt", "aUInt8", "aUInt16", "aUInt32", "aUInt64"]
    for name in propertyNames {
      #expect(result.getProperty(name).isNull() == true, "expected \(name) to be null")
    }
  }

  @Test
  func `emits values for every primitive present optional field`() throws {
    struct AllSet: Encodable {
      let aBool: Bool? = true
      let aString: String? = "expo"
      let aDouble: Double? = 1.5
      let aFloat: Float? = 2.5
      let aInt: Int? = 7
      let aInt8: Int8? = -8
      let aInt16: Int16? = -16
      let aInt32: Int32? = -32
      let aInt64: Int64? = -64
      let aUInt: UInt? = 1
      let aUInt8: UInt8? = 8
      let aUInt16: UInt16? = 0xFFFF
      let aUInt32: UInt32? = 32
      let aUInt64: UInt64? = 64
    }

    let result = try encode(AllSet()).getObject()
    #expect(result.getProperty("aBool").getBool() == true)
    #expect(result.getProperty("aString").getString() == "expo")
    #expect(result.getProperty("aDouble").getDouble() == 1.5)
    #expect(result.getProperty("aFloat").getDouble() == 2.5)
    #expect(result.getProperty("aInt").getInt() == 7)
    #expect(result.getProperty("aInt8").getInt() == -8)
    #expect(result.getProperty("aInt16").getInt() == -16)
    #expect(result.getProperty("aInt32").getInt() == -32)
    #expect(result.getProperty("aInt64").getInt() == -64)
    #expect(result.getProperty("aUInt").getInt() == 1)
    #expect(result.getProperty("aUInt8").getInt() == 8)
    #expect(result.getProperty("aUInt16").getInt() == 0xFFFF)
    #expect(result.getProperty("aUInt32").getInt() == 32)
    #expect(result.getProperty("aUInt64").getInt() == 64)
  }

  // MARK: - Convertible types

  @Test
  func `encodes a URL field as its absolute string`() throws {
    struct Wrapper: Encodable {
      let url: URL
    }

    let result = try encode(Wrapper(url: URL(string: "https://expo.dev/foo")!)).getObject()
    #expect(result.getProperty("url").getString() == "https://expo.dev/foo")
  }

  @Test
  func `encodes a CGPoint field as an object with x and y`() throws {
    struct Wrapper: Encodable {
      let point: CGPoint
    }

    let result = try encode(Wrapper(point: CGPoint(x: 10, y: 20))).getObject()
    let point = result.getPropertyAsObject("point")

    #expect(point.getProperty("x").getDouble() == 10)
    #expect(point.getProperty("y").getDouble() == 20)
  }

  @Test
  func `encodes a CGSize field as an object with width and height`() throws {
    struct Wrapper: Encodable {
      let size: CGSize
    }

    let result = try encode(Wrapper(size: CGSize(width: 100, height: 200))).getObject()
    let size = result.getPropertyAsObject("size")

    #expect(size.getProperty("width").getDouble() == 100)
    #expect(size.getProperty("height").getDouble() == 200)
  }

  @Test
  func `encodes a CGRect field as an object with x y width height`() throws {
    struct Wrapper: Encodable {
      let rect: CGRect
    }

    let result = try encode(Wrapper(rect: CGRect(x: 1, y: 2, width: 3, height: 4))).getObject()
    let rect = result.getPropertyAsObject("rect")

    #expect(rect.getProperty("x").getDouble() == 1)
    #expect(rect.getProperty("y").getDouble() == 2)
    #expect(rect.getProperty("width").getDouble() == 3)
    #expect(rect.getProperty("height").getDouble() == 4)
  }

  // MARK: - More edge cases

  @Test
  func `encodes a top-level dictionary`() throws {
    let result = try encode(["a": 1, "b": 2]).getObject()
    #expect(result.getProperty("a").getInt() == 1)
    #expect(result.getProperty("b").getInt() == 2)
  }

  @Test
  func `encodes an optional Convertible field`() throws {
    struct Wrapper: Encodable {
      let url: URL?
    }

    let present = try encode(Wrapper(url: URL(string: "https://expo.dev/foo")!)).getObject()
    #expect(present.getProperty("url").getString() == "https://expo.dev/foo")

    let absent = try encode(Wrapper(url: nil)).getObject()
    #expect(absent.getProperty("url").isNull() == true)
  }

  @Test
  func `encodes an array of optional strings with nil entries`() throws {
    let array = try encode(["a", nil, "c"] as [String?]).getArray()

    #expect(array.length == 3)
    #expect(try array.getValue(at: 0).getString() == "a")
    #expect(try array.getValue(at: 1).isNull() == true)
    #expect(try array.getValue(at: 2).getString() == "c")
  }

  @Test
  func `encodes an array of CGPoint through the two-level fast path`() throws {
    let array = try encode([CGPoint(x: 1, y: 2), CGPoint(x: 3, y: 4)]).getArray()

    #expect(array.length == 2)
    let first = try array.getValue(at: 0).getObject()
    #expect(first.getProperty("x").getDouble() == 1)
    #expect(first.getProperty("y").getDouble() == 2)
    let second = try array.getValue(at: 1).getObject()
    #expect(second.getProperty("x").getDouble() == 3)
    #expect(second.getProperty("y").getDouble() == 4)
  }

  @Test
  func `encodes empty strings and zero numbers as themselves not null`() throws {
    #expect(try encode("").getString() == "")
    #expect(try encode(0).getInt() == 0)
    #expect(try encode(0.0).getDouble() == 0)
    #expect(try encode(false).getBool() == false)
  }

  @Test
  func `encodes a class as a JS object`() throws {
    final class Person: Encodable {
      let name: String
      let age: Int
      init(name: String, age: Int) {
        self.name = name
        self.age = age
      }
    }

    let result = try encode(Person(name: "Anna", age: 30)).getObject()
    #expect(result.getProperty("name").getString() == "Anna")
    #expect(result.getProperty("age").getInt() == 30)
  }

  // MARK: - Routing through DynamicEncodableType

  @Test
  func `DynamicEncodableType castToJS encodes a struct end-to-end`() throws {
    struct User: Encodable {
      let name: String
      let age: Int
    }

    let dynamicType = ~User.self
    #expect(dynamicType is DynamicEncodableType)

    let result = try dynamicType.castToJS(
      User(name: "Anna", age: 30),
      appContext: appContext,
      in: appContext.runtime
    ).getObject()

    #expect(result.getProperty("name").getString() == "Anna")
    #expect(result.getProperty("age").getInt() == 30)
  }
}
