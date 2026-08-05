// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@testable import ExpoModulesCore

enum CodableColor: String, Enumerable {
  case red
  case green
}

enum CodablePriority: Int, Enumerable {
  case low = 1
  case high = 2
}

@Suite("JavaScriptCodable+Enumerable")
@JavaScriptActor
struct JavaScriptCodableEnumerableTests {
  let appContext = AppContext.create()

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  // MARK: - String-backed enum

  @Test
  func `decodes and encodes a string enum`() throws {
    let runtime = try runtime
    let decoded = try CodableColor.decode(runtime.eval("'green'"), in: runtime)
    #expect(decoded == .green)
    let encoded = try CodableColor.encode(.red, in: runtime)
    #expect(encoded.getString() == "red")
  }

  // MARK: - Int-backed enum

  @Test
  func `decodes and encodes an int enum`() throws {
    let runtime = try runtime
    let decoded = try CodablePriority.decode(runtime.eval("2"), in: runtime)
    #expect(decoded == .high)
    let encoded = try CodablePriority.encode(.low, in: runtime)
    #expect(encoded.getInt() == 1)
  }

  // MARK: - Round-trips

  @Test
  func `round-trips a string enum`() throws {
    let runtime = try runtime
    for color in [CodableColor.red, .green] {
      let roundTripped = try CodableColor.decode(CodableColor.encode(color, in: runtime), in: runtime)
      #expect(roundTripped == color)
    }
  }

  @Test
  func `round-trips an int enum`() throws {
    let runtime = try runtime
    for priority in [CodablePriority.low, .high] {
      let roundTripped = try CodablePriority.decode(CodablePriority.encode(priority, in: runtime), in: runtime)
      #expect(roundTripped == priority)
    }
  }

  // MARK: - Encoded primitive kind

  @Test
  func `encodes a string enum to a JS string and an int enum to a JS number`() throws {
    let runtime = try runtime
    #expect(try CodableColor.encode(.red, in: runtime).isString())
    #expect(try CodablePriority.encode(.low, in: runtime).isNumber())
  }

  // MARK: - Error paths

  @Test
  func `string enum decode throws no-such-value for an unknown raw value`() throws {
    let runtime = try runtime
    #expect(throws: EnumNoSuchValueException.self) {
      _ = try CodableColor.decode(runtime.eval("'purple'"), in: runtime)
    }
  }

  @Test
  func `int enum decode throws no-such-value for an out-of-range raw value`() throws {
    let runtime = try runtime
    #expect(throws: EnumNoSuchValueException.self) {
      _ = try CodablePriority.decode(runtime.eval("3"), in: runtime)
    }
  }

  @Test
  func `string enum decode throws before create when the JS value is the wrong type`() throws {
    // A number can't decode into the `String` raw value, so `RawValue.decode` throws before
    // `create(fromRawValue:)` is ever reached — a distinct failure mode from a no-such-value.
    let runtime = try runtime
    #expect(throws: (any Error).self) {
      _ = try CodableColor.decode(runtime.eval("42"), in: runtime)
    }
  }
}
