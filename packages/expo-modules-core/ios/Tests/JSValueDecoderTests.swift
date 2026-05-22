// Copyright 2026-present 650 Industries. All rights reserved.

import CoreGraphics
import Foundation
import Testing
import ExpoModulesJSI

@testable import ExpoModulesCore

@Suite("JSValueDecoder")
@JavaScriptActor
struct JSValueDecoderTests {
  let appContext = AppContext.create()

  private func decode<ValueType: Decodable>(_ type: ValueType.Type, from source: String) throws -> ValueType {
    let jsValue = try appContext.runtime.eval(source)
    let decoder = try JSValueDecoder(value: jsValue, appContext: appContext)
    return try ValueType(from: decoder)
  }

  // MARK: - Primitives in single-value container

  @Test
  func `decodes a string`() throws {
    #expect(try decode(String.self, from: "'expo'") == "expo")
  }

  @Test
  func `decodes an int`() throws {
    #expect(try decode(Int.self, from: "42") == 42)
  }

  @Test
  func `decodes a double`() throws {
    #expect(try decode(Double.self, from: "3.5") == 3.5)
  }

  @Test
  func `decodes a bool`() throws {
    #expect(try decode(Bool.self, from: "true") == true)
  }

  @Test
  func `decodes a top-level nil optional from null`() throws {
    #expect(try decode(String?.self, from: "null") == nil)
  }

  @Test
  func `decodes a top-level present optional`() throws {
    #expect(try decode(String?.self, from: "'expo'") == "expo")
  }

  // MARK: - Plain Decodable struct

  @Test
  func `decodes a flat struct`() throws {
    struct Point: Decodable, Equatable {
      let x: Int
      let y: Int
    }
    #expect(try decode(Point.self, from: "({x: 3, y: 4})") == Point(x: 3, y: 4))
  }

  // MARK: - Nested keyed container

  @Test
  func `decodes a nested struct`() throws {
    struct Inner: Decodable, Equatable {
      let label: String
    }
    struct Outer: Decodable, Equatable {
      let id: Int
      let inner: Inner
    }

    let result = try decode(Outer.self, from: "({id: 1, inner: {label: 'hello'}})")
    #expect(result == Outer(id: 1, inner: Inner(label: "hello")))
  }

  // MARK: - Arrays

  @Test
  func `decodes an array of primitives`() throws {
    #expect(try decode([Int].self, from: "[10, 20, 30]") == [10, 20, 30])
  }

  @Test
  func `decodes a struct field that is an array of structs`() throws {
    struct Item: Decodable, Equatable {
      let value: Int
    }
    struct List: Decodable, Equatable {
      let items: [Item]
    }

    let result = try decode(List.self, from: "({items: [{value: 1}, {value: 2}, {value: 3}]})")
    #expect(result == List(items: [Item(value: 1), Item(value: 2), Item(value: 3)]))
  }

  // MARK: - Dictionaries

  @Test
  func `decodes a string-keyed dictionary field`() throws {
    struct Wrapper: Decodable, Equatable {
      let counts: [String: Int]
    }
    let result = try decode(Wrapper.self, from: "({counts: {a: 1, b: 2}})")
    #expect(result == Wrapper(counts: ["a": 1, "b": 2]))
  }

  // MARK: - Optionals

  @Test
  func `decodes a present optional field`() throws {
    struct Wrapper: Decodable, Equatable {
      let label: String?
    }
    let result = try decode(Wrapper.self, from: "({label: 'present'})")
    #expect(result == Wrapper(label: "present"))
  }

  @Test
  func `decodes a null optional field as nil`() throws {
    struct Wrapper: Decodable, Equatable {
      let label: String?
    }
    let result = try decode(Wrapper.self, from: "({label: null})")
    #expect(result == Wrapper(label: nil))
  }

  @Test
  func `decodes a missing optional field as nil`() throws {
    struct Wrapper: Decodable, Equatable {
      let label: String?
    }
    let result = try decode(Wrapper.self, from: "({})")
    #expect(result == Wrapper(label: nil))
  }

  // MARK: - RawRepresentable enums

  @Test
  func `decodes a string-backed enum field as its raw value`() throws {
    enum Direction: String, Decodable, Enumerable {
      case north
      case south
    }
    struct Wrapper: Decodable, Equatable {
      let direction: Direction
    }

    let result = try decode(Wrapper.self, from: "({direction: 'north'})")
    #expect(result == Wrapper(direction: .north))
  }

  @Test
  func `decodes an int-backed enum field as its raw value`() throws {
    enum Code: Int, Decodable, Enumerable {
      case ok = 200
      case notFound = 404
    }
    struct Wrapper: Decodable, Equatable {
      let code: Code
    }

    let result = try decode(Wrapper.self, from: "({code: 404})")
    #expect(result == Wrapper(code: .notFound))
  }

  // MARK: - Edge cases

  @Test
  func `decodes an empty array`() throws {
    #expect(try decode([Int].self, from: "[]") == [])
  }

  @Test
  func `decodes an empty struct`() throws {
    struct Empty: Decodable, Equatable {}
    _ = try decode(Empty.self, from: "({})")
  }

  @Test
  func `decodes a nested array of arrays`() throws {
    #expect(try decode([[Int]].self, from: "[[1, 2], [3, 4, 5]]") == [[1, 2], [3, 4, 5]])
  }

  @Test
  func `decodes empty strings and zero numbers as themselves`() throws {
    #expect(try decode(String.self, from: "''") == "")
    #expect(try decode(Int.self, from: "0") == 0)
    #expect(try decode(Double.self, from: "0.0") == 0)
    #expect(try decode(Bool.self, from: "false") == false)
  }

  // MARK: - All 14 primitive optional fields, nil and present

  @Test
  func `decodes all primitive nil optional fields`() throws {
    struct AllNils: Decodable, Equatable {
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
    }

    let source = """
    ({
      aBool: null, aString: null, aDouble: null, aFloat: null,
      aInt: null, aInt8: null, aInt16: null, aInt32: null, aInt64: null,
      aUInt: null, aUInt8: null, aUInt16: null, aUInt32: null, aUInt64: null
    })
    """
    let result = try decode(AllNils.self, from: source)
    #expect(result.aBool == nil)
    #expect(result.aString == nil)
    #expect(result.aDouble == nil)
    #expect(result.aFloat == nil)
    #expect(result.aInt == nil)
    #expect(result.aInt8 == nil)
    #expect(result.aInt16 == nil)
    #expect(result.aInt32 == nil)
    #expect(result.aInt64 == nil)
    #expect(result.aUInt == nil)
    #expect(result.aUInt8 == nil)
    #expect(result.aUInt16 == nil)
    #expect(result.aUInt32 == nil)
    #expect(result.aUInt64 == nil)
  }

  @Test
  func `decodes all primitive present optional fields`() throws {
    struct AllSet: Decodable, Equatable {
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
    }

    let source = """
    ({
      aBool: true, aString: 'expo', aDouble: 1.5, aFloat: 2.5,
      aInt: 7, aInt8: -8, aInt16: -16, aInt32: -32, aInt64: -64,
      aUInt: 1, aUInt8: 8, aUInt16: 0xFFFF, aUInt32: 32, aUInt64: 64
    })
    """
    let result = try decode(AllSet.self, from: source)
    #expect(result.aBool == true)
    #expect(result.aString == "expo")
    #expect(result.aDouble == 1.5)
    #expect(result.aFloat == 2.5)
    #expect(result.aInt == 7)
    #expect(result.aInt8 == -8)
    #expect(result.aInt16 == -16)
    #expect(result.aInt32 == -32)
    #expect(result.aInt64 == -64)
    #expect(result.aUInt == 1)
    #expect(result.aUInt8 == 8)
    #expect(result.aUInt16 == 0xFFFF)
    #expect(result.aUInt32 == 32)
    #expect(result.aUInt64 == 64)
  }

  // MARK: - Convertible types

  @Test
  func `decodes a URL field`() throws {
    struct Wrapper: Decodable, Equatable {
      let url: URL
    }
    let result = try decode(Wrapper.self, from: "({url: 'https://expo.dev/foo'})")
    #expect(result.url == URL(string: "https://expo.dev/foo")!)
  }

  @Test
  func `decodes a CGPoint field`() throws {
    struct Wrapper: Decodable, Equatable {
      let point: CGPoint
    }
    let result = try decode(Wrapper.self, from: "({point: {x: 10, y: 20}})")
    #expect(result.point == CGPoint(x: 10, y: 20))
  }

  @Test
  func `decodes a CGSize field`() throws {
    struct Wrapper: Decodable, Equatable {
      let size: CGSize
    }
    let result = try decode(Wrapper.self, from: "({size: {width: 100, height: 200}})")
    #expect(result.size == CGSize(width: 100, height: 200))
  }

  @Test
  func `decodes a CGRect field`() throws {
    struct Wrapper: Decodable, Equatable {
      let rect: CGRect
    }
    let result = try decode(Wrapper.self, from: "({rect: {x: 1, y: 2, width: 3, height: 4}})")
    #expect(result.rect == CGRect(x: 1, y: 2, width: 3, height: 4))
  }

  // MARK: - Optional Convertible

  @Test
  func `decodes a present optional Convertible field`() throws {
    struct Wrapper: Decodable, Equatable {
      let url: URL?
    }
    let result = try decode(Wrapper.self, from: "({url: 'https://expo.dev/foo'})")
    #expect(result.url == URL(string: "https://expo.dev/foo")!)
  }

  @Test
  func `decodes a null optional Convertible field as nil`() throws {
    struct Wrapper: Decodable, Equatable {
      let url: URL?
    }
    let result = try decode(Wrapper.self, from: "({url: null})")
    #expect(result.url == nil)
  }

  // MARK: - Top-level collections

  @Test
  func `decodes a top-level dictionary`() throws {
    #expect(try decode([String: Int].self, from: "({a: 1, b: 2})") == ["a": 1, "b": 2])
  }

  @Test
  func `decodes an array of CGPoint`() throws {
    let result = try decode([CGPoint].self, from: "[{x: 1, y: 2}, {x: 3, y: 4}]")
    #expect(result == [CGPoint(x: 1, y: 2), CGPoint(x: 3, y: 4)])
  }

  // MARK: - Class

  @Test
  func `decodes a class as a JS object`() throws {
    final class Person: Decodable {
      let name: String
      let age: Int
    }
    let result = try decode(Person.self, from: "({name: 'Anna', age: 30})")
    #expect(result.name == "Anna")
    #expect(result.age == 30)
  }

  // MARK: - Error cases

  @Test
  func `throws keyNotFound for missing non-optional field`() throws {
    struct Wrapper: Decodable {
      let required: String
    }
    #expect(throws: DecodingError.self) {
      _ = try decode(Wrapper.self, from: "({})")
    }
  }

  @Test
  func `throws typeMismatch when expecting object but got primitive`() throws {
    struct Wrapper: Decodable {
      let value: Int
    }
    #expect(throws: DecodingError.self) {
      _ = try decode(Wrapper.self, from: "42")
    }
  }

  @Test
  func `throws keyNotFound when non-optional field is explicitly undefined`() throws {
    struct Wrapper: Decodable {
      let required: String
    }
    #expect(throws: DecodingError.self) {
      _ = try decode(Wrapper.self, from: "({required: undefined})")
    }
  }

  @Test
  func `throws when non-optional field is null`() throws {
    struct Wrapper: Decodable {
      let required: String
    }
    #expect(throws: DecodingError.self) {
      _ = try decode(Wrapper.self, from: "({required: null})")
    }
  }

  @Test
  func `throws valueNotFound when unkeyed container is exhausted`() throws {
    // A struct that asks for more elements than the array provides — forces the
    // unkeyed container past `isAtEnd` and exercises the guard in `nextValue`.
    struct ThreeInts: Decodable {
      let a: Int
      let b: Int
      let c: Int
      init(from decoder: Decoder) throws {
        var container = try decoder.unkeyedContainer()
        self.a = try container.decode(Int.self)
        self.b = try container.decode(Int.self)
        self.c = try container.decode(Int.self)
      }
    }
    #expect(throws: DecodingError.self) {
      _ = try decode(ThreeInts.self, from: "[1, 2]")
    }
  }

  // MARK: - Routing through DynamicCodableType

  @Test
  func `DynamicCodableType cast(jsValue:) decodes a struct end-to-end`() throws {
    struct User: Decodable, Equatable {
      let name: String
      let age: Int
    }

    let dynamicType = ~User.self
    #expect(dynamicType is DynamicCodableType<User>)

    let jsValue = try appContext.runtime.eval("({name: 'Anna', age: 30})")
    let any = try dynamicType.cast(jsValue: jsValue, appContext: appContext)
    let user = try #require(any as? User)
    #expect(user == User(name: "Anna", age: 30))
  }

  // MARK: - More error cases

  @Test
  func `throws typeMismatch when expecting array but got primitive`() throws {
    #expect(throws: DecodingError.self) {
      _ = try decode([Int].self, from: "42")
    }
  }

  @Test
  func `wraps Convertible coercion failures as dataCorrupted`() throws {
    struct Wrapper: Decodable {
      let url: URL
    }
    #expect(throws: DecodingError.self) {
      _ = try decode(Wrapper.self, from: "({url: 42})")
    }
  }

  // MARK: - Unkeyed container — direct surface via custom init(from:)

  @Test
  func `unkeyed decodeNil reports null elements without advancing past non-null`() throws {
    struct NullThenInt: Decodable {
      let first: Int?
      let second: Int
      init(from decoder: Decoder) throws {
        var container = try decoder.unkeyedContainer()
        if try container.decodeNil() {
          self.first = nil
        } else {
          self.first = try container.decode(Int.self)
        }
        self.second = try container.decode(Int.self)
      }
    }

    let nullFirst = try decode(NullThenInt.self, from: "[null, 7]")
    #expect(nullFirst.first == nil)
    #expect(nullFirst.second == 7)

    let intFirst = try decode(NullThenInt.self, from: "[3, 7]")
    #expect(intFirst.first == 3)
    #expect(intFirst.second == 7)
  }

  @Test
  func `unkeyed decodeIfPresent returns nil at end and skips null`() throws {
    struct ThreeMaybeInts: Decodable {
      let values: [Int?]
      init(from decoder: Decoder) throws {
        var container = try decoder.unkeyedContainer()
        var collected: [Int?] = []
        while !container.isAtEnd {
          collected.append(try container.decodeIfPresent(Int.self))
        }
        self.values = collected
      }
    }

    let result = try decode(ThreeMaybeInts.self, from: "[1, null, 3]")
    #expect(result.values == [1, nil, 3])
  }

  @Test
  func `unkeyed nestedContainer throws typeMismatch when element is not an object`() throws {
    struct PullsObject: Decodable {
      init(from decoder: Decoder) throws {
        var container = try decoder.unkeyedContainer()
        _ = try container.nestedContainer(keyedBy: AnyCodingKey.self)
      }
    }
    #expect(throws: DecodingError.self) {
      _ = try decode(PullsObject.self, from: "[1]")
    }
  }

  @Test
  func `unkeyed nestedUnkeyedContainer throws typeMismatch when element is not an array`() throws {
    struct PullsArray: Decodable {
      init(from decoder: Decoder) throws {
        var container = try decoder.unkeyedContainer()
        _ = try container.nestedUnkeyedContainer()
      }
    }
    #expect(throws: DecodingError.self) {
      _ = try decode(PullsArray.self, from: "[1]")
    }
  }

  // MARK: - Keyed container — allKeys / contains

  @Test
  func `keyed allKeys and contains expose JS object property names`() throws {
    struct KeyReport: Decodable {
      let keys: [String]
      let hasFoo: Bool
      let hasMissing: Bool

      init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: AnyCodingKey.self)
        self.keys = container.allKeys.map(\.stringValue).sorted()
        self.hasFoo = container.contains(AnyCodingKey(stringValue: "foo"))
        self.hasMissing = container.contains(AnyCodingKey(stringValue: "missing"))
      }
    }

    let result = try decode(KeyReport.self, from: "({foo: 1, bar: 2})")
    #expect(result.keys == ["bar", "foo"])
    #expect(result.hasFoo == true)
    #expect(result.hasMissing == false)
  }
}
