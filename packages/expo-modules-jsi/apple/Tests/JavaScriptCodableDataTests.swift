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
    // Exercises the `byteLength == 0` decode guard and encoding an empty `Data`.
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

  @Test
  func `decodes Data from a Uint8Array sub-view with non-zero byteOffset`() throws {
    let value = try runtime.eval("new Uint8Array(new Uint8Array([10, 20, 30, 40, 50]).buffer, 1, 3)")
    let decoded = try Data.decode(value, in: runtime)
    #expect(Array(decoded) == [20, 30, 40])

    let buffer = JavaScriptValuesBuffer.copying(in: runtime, values: [JavaScriptValue.Ref(value)])
    let unownedDecoded = try Data.decode(buffer.unownedValue(at: 0), in: runtime)
    #expect(Array(unownedDecoded) == [20, 30, 40])
  }

  @Test
  func `decodes Data from a Uint8Array subclass and ignores shadowed byteLength`() throws {
    let subclass = try runtime.eval("(() => { class Bytes extends Uint8Array {} return new Bytes([7, 8, 9]); })()")
    #expect(Array(try Data.decode(subclass, in: runtime)) == [7, 8, 9])

    let shadowed = try runtime.eval(
      """
      (() => {
        const u8 = new Uint8Array([1, 2, 3, 4]);
        Object.defineProperty(u8, 'byteLength', { value: 1 << 30 });
        return u8;
      })()
      """
    )
    #expect(Array(try Data.decode(shadowed, in: runtime)) == [1, 2, 3, 4])
  }

  // MARK: - Error paths

  @Test
  func `Data decode throws on a non-Uint8Array`() throws {
    for source in [
      "[1, 2, 3]",
      "new Float64Array([1, 2])",
      "new DataView(new ArrayBuffer(4))",
      "new Proxy(new Uint8Array(4), {})",
      "Object.create(Uint8Array.prototype)",
    ] {
      #expect(throws: DataNotUint8ArrayException.self) {
        _ = try Data.decode(runtime.eval(source), in: runtime)
      }
    }
  }
}
