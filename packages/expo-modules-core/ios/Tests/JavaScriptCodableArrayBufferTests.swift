// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
import Testing

@testable import ExpoModulesCore

@Suite("JavaScriptCodable+ArrayBuffer")
@JavaScriptActor
struct JavaScriptCodableArrayBufferTests {
  let appContext = AppContext.create()

  var runtime: ExpoRuntime {
    get throws {
      try appContext.runtime
    }
  }

  @Test
  func `decodes JS-backed ArrayBuffer as lazy JavaScript-backed view`() throws {
    let runtime = try runtime
    let value = try runtime.eval("new Uint8Array([1, 2, 3]).buffer")
    let decoded = try ArrayBuffer.decode(value, in: runtime)

    #expect(decoded.byteLength == 3)
    #expect(decoded.isNativeBacked == false)
    #expect(Array(decoded.data) == [1, 2, 3])
  }

  @Test
  func `decodes borrowed JavaScript value as lazy JavaScript-backed view`() throws {
    let runtime = try runtime
    let value = try runtime.eval(
      """
        const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
        new Uint8Array(buffer, 1, 2);
      """
    )
    let values = JavaScriptValuesBuffer.copying(in: runtime, values: [value])

    let decoded = try ArrayBuffer.decode(values.unownedValue(at: 0), in: runtime)

    #expect(decoded.byteLength == 2)
    #expect(decoded.isNativeBacked == false)
    #expect(Array(decoded.data) == [2, 3])
  }

  @Test
  func `decodes JS-backed typed array view as lazy JavaScript-backed view range`() throws {
    let runtime = try runtime
    let value = try runtime.eval(
      """
        const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
        new Uint8Array(buffer, 1, 2);
      """
    )
    let decoded = try ArrayBuffer.decode(value, in: runtime)

    #expect(decoded.byteLength == 2)
    #expect(decoded.isNativeBacked == false)
    #expect(Array(decoded.data) == [2, 3])
  }

  @Test
  func `decodes native-backed ArrayBuffer as native-backed borrowed storage`() throws {
    let runtime = try runtime
    let nativeBuffer = try makeArrayBuffer(bytes: [1, 2, 3])
    let value = nativeBuffer.asJavaScriptArrayBuffer(runtime: runtime).asValue()

    let decoded = try ArrayBuffer.decode(value, in: runtime)

    #expect(decoded.byteLength == 3)
    #expect(decoded.isNativeBacked == true)
    #expect(Array(decoded.data) == [1, 2, 3])
  }

  @Test
  func `decodes native-backed typed array view as native-backed borrowed view range`() throws {
    let runtime = try runtime
    let nativeBuffer = try makeArrayBuffer(bytes: [1, 2, 3, 4, 5])
    runtime.global().setProperty(
      "nativeBuffer", value: nativeBuffer.asJavaScriptArrayBuffer(runtime: runtime).asValue())
    let value = try runtime.eval("new Uint8Array(nativeBuffer, 1, 2)")

    let decoded = try ArrayBuffer.decode(value, in: runtime)

    #expect(decoded.byteLength == 2)
    #expect(decoded.isNativeBacked == true)
    #expect(Array(decoded.data) == [2, 3])
  }

  @Test
  func `encodes ArrayBuffer to JavaScript ArrayBuffer`() throws {
    let runtime = try runtime
    let buffer = try makeArrayBuffer(bytes: [4, 5, 6])

    let encoded = try ArrayBuffer.encode(buffer, in: runtime)
    runtime.global().setProperty("encodedBuffer", value: encoded)
    let values = try runtime.eval("Array.from(new Uint8Array(encodedBuffer))").getArray().map { try $0.asInt() }

    #expect(encoded.isArrayBuffer() == true)
    #expect(values == [4, 5, 6])
  }

  @Test
  func `decodes dictionary values as ArrayBuffer`() throws {
    let runtime = try runtime
    let value = try runtime.eval("({ payload: new Uint8Array([7, 8, 9]).buffer })")

    let decoded = try [String: ArrayBuffer].decode(value, in: runtime)
    let buffer = try #require(decoded["payload"])

    #expect(buffer.byteLength == 3)
    #expect(buffer.isNativeBacked == false)
    #expect(Array(buffer.data) == [7, 8, 9])
  }

  @Test
  func `decodes array elements as ArrayBuffer`() throws {
    let runtime = try runtime
    let value = try runtime.eval("[new Uint8Array([10, 11]).buffer]")

    let decoded = try [ArrayBuffer].decode(value, in: runtime)

    #expect(decoded.count == 1)
    #expect(decoded[0].byteLength == 2)
    #expect(decoded[0].isNativeBacked == false)
    #expect(Array(decoded[0].data) == [10, 11])
  }

  // MARK: - Error paths

  @Test
  func `decode throws for a non-object value`() throws {
    let runtime = try runtime
    #expect(throws: ArrayBufferJavaScriptValueConversionException.self) {
      _ = try ArrayBuffer.decode(runtime.eval("42"), in: runtime)
    }
  }

  @Test
  func `decode throws for an object that is neither ArrayBuffer nor typed array`() throws {
    let runtime = try runtime
    #expect(throws: ArrayBufferJavaScriptValueConversionException.self) {
      _ = try ArrayBuffer.decode(runtime.eval("({})"), in: runtime)
    }
  }

  // MARK: - Empty and wide-element buffers

  @Test
  func `decodes an empty ArrayBuffer`() throws {
    // A zero-length buffer short-circuits the borrow/copy logic; it must not touch a base address.
    let runtime = try runtime
    let decoded = try ArrayBuffer.decode(runtime.eval("new Uint8Array([]).buffer"), in: runtime)
    #expect(decoded.byteLength == 0)
    #expect(decoded.isNativeBacked == true)
  }

  @Test
  func `decodes the raw bytes of a wide-element typed array buffer`() throws {
    // `ArrayBuffer` is byte-oriented; a `Float64Array.buffer` is 8 bytes per element, so `byteLength`
    // must reflect bytes (16), not element count (2) — an element-vs-byte confusion would fail here.
    let runtime = try runtime
    let decoded = try ArrayBuffer.decode(runtime.eval("new Float64Array([1.5, -2.5]).buffer"), in: runtime)
    #expect(decoded.byteLength == 16)
  }

  private func makeArrayBuffer(bytes: [UInt8]) throws -> ArrayBuffer {
    return try ArrayBuffer.copy(data: Data(bytes))
  }
}
