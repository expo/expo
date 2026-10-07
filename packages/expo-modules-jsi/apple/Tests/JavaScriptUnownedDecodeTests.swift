// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
import Testing

/// Decodes through the `JavaScriptUnownedValue` overloads, and through `withUnownedValue(in:_:)` from an
/// owning value.
@Suite("JavaScriptDecodable unowned decode")
@JavaScriptActor
struct JavaScriptUnownedDecodeTests {
  let runtime = JavaScriptRuntime()

  private func unowned<T: JavaScriptDecodable>(_ type: T.Type, from source: String) throws -> T {
    let value = try runtime.eval(source)
    let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: value)
    return try T.decode(buffer.unownedValue(at: 0), in: runtime)
  }

  // MARK: - withUnownedValue

  @Test
  func `withUnownedValue borrows the value it is called on`() throws {
    let number = try runtime.eval("42")
    #expect(number.withUnownedValue(in: runtime) { $0.getDouble() } == 42)

    let string = try runtime.eval("'text'")
    #expect(string.withUnownedValue(in: runtime) { $0.getString() } == "text")

    let object = try runtime.eval("({ answer: 42 })")
    let answer = try object.withUnownedValue(in: runtime) { try $0.asObject(in: runtime).getProperty("answer").asInt() }
    #expect(answer == 42)
  }

  @Test
  func `withUnownedValue works for a value without a runtime`() {
    let value = JavaScriptValue.number(1.5)
    #expect(value.withUnownedValue(in: runtime) { $0.getDouble() } == 1.5)
  }

  // MARK: - Default owning decode

  @Test
  func `a type that only decodes unowned values also decodes owning ones`() throws {
    let value = try runtime.eval("7")
    #expect(try UnownedOnly.decode(value, in: runtime) == UnownedOnly(number: 7))
  }

  // MARK: - Containers

  @Test
  func `Array decodes an array and arrayizes a scalar`() throws {
    #expect(try unowned([Int].self, from: "[1, 2, 3]") == [1, 2, 3])
    #expect(try unowned([Int].self, from: "4") == [4])
  }

  @Test
  func `Dictionary decodes an object and skips undefined properties`() throws {
    #expect(try unowned([String: Int].self, from: "({ a: 1, b: undefined })") == ["a": 1])
    #expect(throws: (any Error).self) {
      _ = try unowned([String: Int].self, from: "42")
    }
  }

  @Test
  func `Date decodes a number, a string and a Date`() throws {
    #expect(try unowned(Date.self, from: "1000") == Date(timeIntervalSince1970: 1))
    #expect(try unowned(Date.self, from: "'1970-01-01T00:00:02Z'") == Date(timeIntervalSince1970: 2))
    #expect(try unowned(Date.self, from: "new Date(3000)") == Date(timeIntervalSince1970: 3))
    #expect(throws: (any Error).self) {
      _ = try unowned(Date.self, from: "true")
    }
    #expect(throws: (any Error).self) {
      _ = try unowned(Date.self, from: "({ getTime() { return 0 } })")
    }
    #expect(throws: (any Error).self) {
      _ = try unowned(Date.self, from: "'not a date'")
    }
  }

  @Test
  func `Date decodes the same from an owning value`() throws {
    #expect(try Date.decode(runtime.eval("1000"), in: runtime) == Date(timeIntervalSince1970: 1))
    #expect(try Date.decode(runtime.eval("'1970-01-01T00:00:02Z'"), in: runtime) == Date(timeIntervalSince1970: 2))
    #expect(try Date.decode(runtime.eval("new Date(3000)"), in: runtime) == Date(timeIntervalSince1970: 3))
  }
}

/// Implements only the unowned decode, so its owning decode is the protocol default.
private struct UnownedOnly: JavaScriptDecodable, Equatable {
  let number: Double

  @JavaScriptActor
  static func decode(_ value: borrowing JavaScriptUnownedValue, in runtime: borrowing JavaScriptRuntime) throws
    -> UnownedOnly
  {
    return UnownedOnly(number: try value.asDouble())
  }
}
