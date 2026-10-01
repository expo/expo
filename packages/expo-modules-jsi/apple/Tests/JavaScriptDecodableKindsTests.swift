// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
import Testing

@Suite("JavaScriptDecodable.decodableKinds")
@JavaScriptActor
struct JavaScriptDecodableKindsTests {
  let runtime = JavaScriptRuntime()

  /// One sample value of each JS type, keyed by the source that evaluates to it.
  static let samples = [
    "42", "1.5", "'text'", "true", "null", "undefined", "10n", "Symbol()", "({})", "[1]", "new Uint8Array(1)",
    "(function () {})",
  ]

  // MARK: - JavaScriptValueKinds(of:)

  @Test
  func `reads the kind of every JS type from owning and unowned values`() throws {
    let expected: [String: JavaScriptValueKinds] = [
      "42": .number, "1.5": .number, "'text'": .string, "true": .boolean, "null": .null,
      "undefined": .undefined, "10n": .bigint, "Symbol()": .symbol, "({})": .object, "[1]": .object,
      "new Uint8Array(1)": .object, "(function () {})": .object,
    ]
    for source in Self.samples {
      let value = try runtime.eval(source)
      #expect(JavaScriptValueKinds(of: value) == expected[source], "owning \(source)")

      let buffer = JavaScriptValuesBuffer.allocate(in: runtime, with: value)
      let unownedKind = JavaScriptValueKinds(of: buffer.unownedValue(at: 0))
      #expect(unownedKind == expected[source], "unowned \(source)")
    }
  }

  // MARK: - decodableKinds

  /// Checks that `decodableKinds` contains the kind of exactly the `accepted` samples, and that `decode`
  /// throws for every rejected one. A rejection must be definitive, because a union skips the case
  /// without trying to decode it.
  private func expectDecodableKinds<T: JavaScriptDecodable>(
    _ type: T.Type,
    accept accepted: Set<String>,
    sourceLocation: SourceLocation = #_sourceLocation
  ) throws {
    for source in Self.samples {
      let value = try runtime.eval(source)
      let expected = accepted.contains(source)
      #expect(
        T.decodableKinds.contains(JavaScriptValueKinds(of: value)) == expected,
        "\(source)",
        sourceLocation: sourceLocation
      )
      if !expected {
        #expect(throws: (any Error).self, "decode \(source)", sourceLocation: sourceLocation) {
          _ = try T.decode(value, in: runtime)
        }
      }
    }
  }

  static let numbers: Set<String> = ["42", "1.5"]
  static let objects: Set<String> = ["({})", "[1]", "new Uint8Array(1)", "(function () {})"]

  @Test
  func `Bool accepts only booleans`() throws {
    try expectDecodableKinds(Bool.self, accept: ["true"])
  }

  @Test
  func `String accepts only strings`() throws {
    try expectDecodableKinds(String.self, accept: ["'text'"])
  }

  @Test
  func `floating-point types accept only numbers`() throws {
    try expectDecodableKinds(Double.self, accept: Self.numbers)
    try expectDecodableKinds(Float.self, accept: Self.numbers)
    try expectDecodableKinds(CGFloat.self, accept: Self.numbers)
  }

  @Test
  func `narrow integer types accept only numbers`() throws {
    try expectDecodableKinds(Int8.self, accept: Self.numbers)
    try expectDecodableKinds(Int16.self, accept: Self.numbers)
    try expectDecodableKinds(Int32.self, accept: Self.numbers)
    try expectDecodableKinds(UInt8.self, accept: Self.numbers)
    try expectDecodableKinds(UInt16.self, accept: Self.numbers)
    try expectDecodableKinds(UInt32.self, accept: Self.numbers)
  }

  @Test
  func `64-bit integer types accept numbers and bigints`() throws {
    let accepted = Self.numbers.union(["10n"])
    try expectDecodableKinds(Int.self, accept: accepted)
    try expectDecodableKinds(Int64.self, accept: accepted)
    try expectDecodableKinds(UInt.self, accept: accepted)
    try expectDecodableKinds(UInt64.self, accept: accepted)
  }

  @Test
  func `Optional accepts null, undefined and what the wrapped type accepts`() throws {
    try expectDecodableKinds(String?.self, accept: ["'text'", "null", "undefined"])
  }

  @Test
  func `Array accepts objects and what the element type accepts`() throws {
    // A non-array value is decoded as a single-element array.
    try expectDecodableKinds([String].self, accept: Self.objects.union(["'text'"]))
  }

  @Test
  func `Dictionary accepts only objects`() throws {
    try expectDecodableKinds([String: Int].self, accept: Self.objects)
  }

  @Test
  func `Data accepts only objects`() throws {
    try expectDecodableKinds(Data.self, accept: Self.objects)
  }

  @Test
  func `Date accepts numbers, strings and objects`() throws {
    try expectDecodableKinds(Date.self, accept: Self.numbers.union(["'text'"]).union(Self.objects))
  }

  @Test
  func `JavaScriptValue accepts every value`() throws {
    try expectDecodableKinds(JavaScriptValue.self, accept: Set(Self.samples))
  }
}
