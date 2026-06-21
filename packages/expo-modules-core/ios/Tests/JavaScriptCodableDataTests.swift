// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@testable import ExpoModulesCore

@Suite("JavaScriptCodable+Data")
@JavaScriptActor
struct JavaScriptCodableDataTests {
  let appContext = AppContext.create()

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  @Test
  func `decodes Data from a Uint8Array`() throws {
    let runtime = try runtime
    let value = try runtime.eval("new Uint8Array([0, 255, 16])")
    let decoded = try Data.decode(value, in: runtime)
    #expect(Array(decoded) == [0, 255, 16])
  }

  @Test
  func `encodes Data to a Uint8Array`() throws {
    let runtime = try runtime
    let encoded = try Data.encode(Data([1, 2, 3]), in: runtime)
    #expect(encoded.isTypedArray() == true)
    let roundTripped = try Data.decode(encoded, in: runtime)
    #expect(Array(roundTripped) == [1, 2, 3])
  }

  @Test
  func `round-trips empty Data`() throws {
    let runtime = try runtime
    // Exercises the `byteLength == 0` decode guard and the `count > 0` encode guard.
    let decoded = try Data.decode(runtime.eval("new Uint8Array([])"), in: runtime)
    #expect(decoded.isEmpty)
    let encoded = try Data.encode(Data(), in: runtime)
    #expect(encoded.isTypedArray() == true)
    #expect(try Data.decode(encoded, in: runtime).isEmpty)
  }

  @Test
  func `decodes Data through the borrowed-value overload`() throws {
    // `Data` does not override the zero-copy overload, so this goes through the default that copies
    // the borrowed value into an owning one and forwards. It should still decode correctly.
    let runtime = try runtime
    let value = try runtime.eval("new Uint8Array([1, 2, 3])")
    let buffer = JavaScriptValuesBuffer.copying(in: runtime, values: [value])
    let decoded = try Data.decode(buffer.unownedValue(at: 0), in: runtime)
    #expect(Array(decoded) == [1, 2, 3])
  }

  // MARK: - Error paths

  @Test
  func `Data decode throws on a non-Uint8Array`() throws {
    let runtime = try runtime
    #expect(throws: DataNotUint8ArrayException.self) {
      _ = try Data.decode(runtime.eval("[1, 2, 3]"), in: runtime)
    }
    #expect(throws: DataNotUint8ArrayException.self) {
      _ = try Data.decode(runtime.eval("new Float64Array([1, 2])"), in: runtime)
    }
  }
}
