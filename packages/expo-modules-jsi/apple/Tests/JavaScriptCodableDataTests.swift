// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
import Testing

@Suite("JavaScriptCodable+Data")
@JavaScriptActor
struct JavaScriptCodableDataTests {
  let runtime = JavaScriptRuntime()

  @Test
  func `decodes Data from a Uint8Array`() throws {
    let value = try runtime.eval("new Uint8Array([0, 255, 16])")
    let decoded = try Data.decode(value, in: runtime)
    #expect(Array(decoded) == [0, 255, 16])
  }

  @Test
  func `encodes Data to a Uint8Array`() throws {
    let encoded = try Data.encode(Data([1, 2, 3]), in: runtime)
    #expect(encoded.isTypedArray() == true)
    let roundTripped = try Data.decode(encoded, in: runtime)
    #expect(Array(roundTripped) == [1, 2, 3])
  }

  @Test
  func `round-trips empty Data`() throws {
    // Exercises the `byteLength == 0` decode guard and the `count > 0` encode guard.
    let decoded = try Data.decode(runtime.eval("new Uint8Array([])"), in: runtime)
    #expect(decoded.isEmpty)
    let encoded = try Data.encode(Data(), in: runtime)
    #expect(encoded.isTypedArray() == true)
    #expect(try Data.decode(encoded, in: runtime).isEmpty)
  }

  @Test
  func `encoding Data reports its memory to the garbage collector`() throws {
    let size = 1 << 20
    let externalBytes = "HermesInternal.getInstrumentedStats().js_externalBytes"
    let bytesBefore = try runtime.eval(externalBytes).getDouble()
    let encoded = try Data.encode(Data(count: size), in: runtime)
    let bytesAfter = try runtime.eval(externalBytes).getDouble()
    #expect(encoded.isTypedArray() == true)
    #expect(bytesAfter - bytesBefore >= Double(size))
  }

  @Test
  func `decodes Data through the borrowed-value overload`() throws {
    let value = try runtime.eval("new Uint8Array([1, 2, 3])")
    let buffer = JavaScriptValuesBuffer.copying(in: runtime, values: [JavaScriptValue.Ref(value)])
    let decoded = try Data.decode(buffer.unownedValue(at: 0), in: runtime)
    #expect(Array(decoded) == [1, 2, 3])
  }

  @Test
  func `Data decode of a borrowed value throws on a non-Uint8Array`() throws {
    let buffer = JavaScriptValuesBuffer.allocate(
      in: runtime,
      with: try runtime.eval("[1, 2, 3]").ref(),
      try runtime.eval("new Int8Array([1, 2])").ref()
    )
    #expect(throws: DataNotUint8ArrayException.self) {
      _ = try Data.decode(buffer.unownedValue(at: 0), in: runtime)
    }
    #expect(throws: DataNotUint8ArrayException.self) {
      _ = try Data.decode(buffer.unownedValue(at: 1), in: runtime)
    }
  }

  // MARK: - Error paths

  @Test
  func `Data decode throws on a non-Uint8Array`() throws {
    #expect(throws: DataNotUint8ArrayException.self) {
      _ = try Data.decode(runtime.eval("[1, 2, 3]"), in: runtime)
    }
    #expect(throws: DataNotUint8ArrayException.self) {
      _ = try Data.decode(runtime.eval("new Float64Array([1, 2])"), in: runtime)
    }
  }
}
