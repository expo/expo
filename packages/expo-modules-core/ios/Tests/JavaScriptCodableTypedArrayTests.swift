// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Testing

@testable import ExpoModulesCore

@Suite("JavaScriptCodable+TypedArray")
@JavaScriptActor
struct JavaScriptCodableTypedArrayTests {
  let appContext = AppContext.create()

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  // MARK: - Concrete types

  @Test
  func `decodes a Uint8Array`() throws {
    let runtime = try runtime
    let value = try runtime.eval("new Uint8Array([10, 20, 30])")

    let decoded = try Uint8Array.decode(value, in: runtime)

    #expect(decoded.kind == .Uint8Array)
    #expect(decoded.length == 3)
    #expect(decoded[0] == 10)
    #expect(decoded[2] == 30)
  }

  @Test
  func `decodes the integer and float concrete kinds`() throws {
    let runtime = try runtime
    #expect(try Int16Array.decode(runtime.eval("new Int16Array([1, 2])"), in: runtime).kind == .Int16Array)
    #expect(try Int32Array.decode(runtime.eval("new Int32Array([1])"), in: runtime).kind == .Int32Array)
    #expect(try Float32Array.decode(runtime.eval("new Float32Array([1.5])"), in: runtime).kind == .Float32Array)
    #expect(try Float64Array.decode(runtime.eval("new Float64Array([2.5])"), in: runtime).kind == .Float64Array)
    #expect(try BigInt64Array.decode(runtime.eval("new BigInt64Array([1n])"), in: runtime).kind == .BigInt64Array)
  }

  @Test
  func `concrete decode throws on a kind mismatch`() throws {
    let runtime = try runtime
    // A `Uint8Array` decode given a JS `Int16Array` mismatches rather than silently accepting it, and
    // the thrown error carries the expected and received kinds.
    let error = try #require(throws: TypedArray.KindMismatchException.self) {
      _ = try Uint8Array.decode(runtime.eval("new Int16Array([1, 2])"), in: runtime)
    }
    #expect(error.expected == .Uint8Array)
    #expect(error.received == .Int16Array)
  }

  @Test
  func `concrete decode throws when the value is not a typed array`() throws {
    let runtime = try runtime
    #expect(throws: TypedArray.NotATypedArrayException.self) {
      _ = try Uint8Array.decode(runtime.eval("[1, 2, 3]"), in: runtime)
    }
  }

  // MARK: - Base TypedArray

  @Test
  func `base TypedArray decodes any kind into the matching concrete subclass`() throws {
    let runtime = try runtime
    let decodedUint8 = try TypedArray.decode(runtime.eval("new Uint8Array([1])"), in: runtime)
    #expect(decodedUint8 is Uint8Array)
    #expect(decodedUint8.kind == .Uint8Array)

    let decodedFloat64 = try TypedArray.decode(runtime.eval("new Float64Array([1.5])"), in: runtime)
    #expect(decodedFloat64 is Float64Array)
    #expect(decodedFloat64.kind == .Float64Array)
  }

  @Test
  func `base TypedArray decode throws when the value is not a typed array`() throws {
    let runtime = try runtime
    #expect(throws: TypedArray.NotATypedArrayException.self) {
      _ = try TypedArray.decode(runtime.eval("({})"), in: runtime)
    }
  }

  // MARK: - Encode

  @Test
  func `encodes a typed array back to the same JS object`() throws {
    let runtime = try runtime
    let value = try runtime.eval("globalThis.original = new Uint8Array([7, 8, 9]); original")
    let decoded = try Uint8Array.decode(value, in: runtime)

    let encoded = try Uint8Array.encode(decoded, in: runtime)

    // The conversion preserves identity: re-encoding hands back the original JS object, not a copy.
    let isSame = try runtime.eval("v => v === globalThis.original").getFunction().call(arguments: encoded)
    #expect(try isSame.asBool() == true)
  }

  @Test
  func `round-trips a non-Uint8 typed array through the inherited encode`() throws {
    let runtime = try runtime
    // Concrete subclasses inherit `encode` from the base `TypedArray`; round-tripping a `Float64Array`
    // confirms the inherited witness works, not just `Uint8Array`.
    let value = try runtime.eval("new Float64Array([1.5, 2.5])")
    let decoded = try Float64Array.decode(value, in: runtime)

    let encoded = try Float64Array.encode(decoded, in: runtime)
    let reDecoded = try Float64Array.decode(encoded, in: runtime)

    #expect(reDecoded.kind == .Float64Array)
    #expect(reDecoded[0] == 1.5)
    #expect(reDecoded[1] == 2.5)
  }

  @Test
  func `mutations through the decoded array are visible in JS`() throws {
    let runtime = try runtime
    let value = try runtime.eval("globalThis.buf = new Uint8Array([0, 0, 0]); buf")
    let decoded = try Uint8Array.decode(value, in: runtime)

    // No byte copy: writing through the native wrapper mutates the backing JS buffer in place.
    decoded[1] = 42

    #expect(try runtime.eval("globalThis.buf[1]").asInt() == 42)
  }

  // MARK: - Zero-copy borrowed-value overload

  @Test
  func `decodes from a borrowed argument buffer`() throws {
    let runtime = try runtime
    let value = try runtime.eval("new Uint8Array([5, 6])")
    let buffer = JavaScriptValuesBuffer.copying(in: runtime, values: [value])

    let decoded = try Uint8Array.decode(buffer.unownedValue(at: 0), in: runtime)

    #expect(decoded.kind == .Uint8Array)
    #expect(decoded[0] == 5)
  }
}
