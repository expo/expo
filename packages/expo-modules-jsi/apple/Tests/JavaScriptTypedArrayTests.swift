// Copyright 2025-present 650 Industries. All rights reserved.

import Testing
import ExpoModulesJSI

@Suite
@JavaScriptActor
struct JavaScriptTypedArrayTests {
  let runtime = JavaScriptRuntime()

  // MARK: - Kind detection

  @Test
  func `kind is Int8Array`() throws {
    let typedArray = try runtime.eval("new Int8Array(1)").getTypedArray()
    #expect(typedArray.kind == .Int8Array)
  }

  @Test
  func `kind is Int16Array`() throws {
    let typedArray = try runtime.eval("new Int16Array(1)").getTypedArray()
    #expect(typedArray.kind == .Int16Array)
  }

  @Test
  func `kind is Int32Array`() throws {
    let typedArray = try runtime.eval("new Int32Array(1)").getTypedArray()
    #expect(typedArray.kind == .Int32Array)
  }

  @Test
  func `kind is Uint8Array`() throws {
    let typedArray = try runtime.eval("new Uint8Array(1)").getTypedArray()
    #expect(typedArray.kind == .Uint8Array)
  }

  @Test
  func `kind is Uint8ClampedArray`() throws {
    let typedArray = try runtime.eval("new Uint8ClampedArray(1)").getTypedArray()
    #expect(typedArray.kind == .Uint8ClampedArray)
  }

  @Test
  func `kind is Uint16Array`() throws {
    let typedArray = try runtime.eval("new Uint16Array(1)").getTypedArray()
    #expect(typedArray.kind == .Uint16Array)
  }

  @Test
  func `kind is Uint32Array`() throws {
    let typedArray = try runtime.eval("new Uint32Array(1)").getTypedArray()
    #expect(typedArray.kind == .Uint32Array)
  }

  @Test
  func `kind is Float32Array`() throws {
    let typedArray = try runtime.eval("new Float32Array(1)").getTypedArray()
    #expect(typedArray.kind == .Float32Array)
  }

  @Test
  func `kind is Float64Array`() throws {
    let typedArray = try runtime.eval("new Float64Array(1)").getTypedArray()
    #expect(typedArray.kind == .Float64Array)
  }

  @Test
  func `kind is BigInt64Array`() throws {
    let typedArray = try runtime.eval("new BigInt64Array(1)").getTypedArray()
    #expect(typedArray.kind == .BigInt64Array)
  }

  @Test
  func `kind is BigUint64Array`() throws {
    let typedArray = try runtime.eval("new BigUint64Array(1)").getTypedArray()
    #expect(typedArray.kind == .BigUint64Array)
  }

  // MARK: - Properties

  @Test
  func `properties of simple array`() throws {
    let typedArray = try runtime.eval("new Uint8Array([1, 2, 3, 4, 5])").getTypedArray()
    #expect(typedArray.length == 5)
    #expect(typedArray.byteLength == 5)
    #expect(typedArray.byteOffset == 0)
  }

  @Test
  func `properties of empty array`() throws {
    let typedArray = try runtime.eval("new Float32Array(0)").getTypedArray()
    #expect(typedArray.length == 0)
    #expect(typedArray.byteLength == 0)
    #expect(typedArray.byteOffset == 0)
  }

  @Test
  func `byteLength accounts for element size`() throws {
    let int32 = try runtime.eval("new Int32Array(3)").getTypedArray()
    #expect(int32.length == 3)
    #expect(int32.byteLength == 12)

    let float64 = try runtime.eval("new Float64Array(2)").getTypedArray()
    #expect(float64.length == 2)
    #expect(float64.byteLength == 16)
  }

  @Test
  func `properties with offset and length`() throws {
    let typedArray = try runtime.eval("""
      var buf = new ArrayBuffer(16);
      new Int32Array(buf, 4, 2)
    """).getTypedArray()

    #expect(typedArray.length == 2)
    #expect(typedArray.byteOffset == 4)
    #expect(typedArray.byteLength == 8)
  }

  // MARK: - getProperty

  @Test
  func `getProperty reads elements`() throws {
    let typedArray = try runtime.eval("new Uint8Array([10, 20, 30])").getTypedArray()
    #expect(typedArray.getProperty("0").getInt() == 10)
    #expect(typedArray.getProperty("1").getInt() == 20)
    #expect(typedArray.getProperty("2").getInt() == 30)
  }

  @Test
  func `getProperty reads length`() throws {
    let typedArray = try runtime.eval("new Int16Array(7)").getTypedArray()
    #expect(typedArray.getProperty("length").getInt() == 7)
  }

  // MARK: - Direct memory access

  @Test
  func `writes through withUnsafeMutableBytes are visible in JS`() throws {
    let value = try runtime.eval("new Uint8Array(3)")
    let typedArray = value.getTypedArray()

    typedArray.withUnsafeMutableBytes { bytes in
      bytes[0] = 42
      bytes[1] = 99
      bytes[2] = 255
    }

    let result = try runtime.eval("val => [val[0], val[1], val[2]]").getFunction().call(arguments: value).getArray()
    #expect(result[0].getInt() == 42)
    #expect(result[1].getInt() == 99)
    #expect(result[2].getInt() == 255)
  }

  @Test
  func `withUnsafeBytes reflects JS writes`() throws {
    let value = try runtime.eval("new Uint8Array([0, 0, 0])")
    let typedArray = value.getTypedArray()

    try runtime.eval("val => { val[1] = 77 }").getFunction().call(arguments: value)

    typedArray.withUnsafeBytes { bytes in
      #expect(bytes[1] == 77)
    }
  }

  @Test
  func `data survives JS garbage collection`() throws {
    // Create the typed array and immediately drop any JS-side reference to it.
    let typedArray = try runtime.eval("(() => new Uint8Array([1, 2, 3, 4]))()").getTypedArray()

    // The backing ArrayBuffer should remain alive because `JavaScriptTypedArray` holds it.
    try runtime.eval("gc() && gc() && gc()")

    typedArray.withUnsafeBytes { bytes in
      #expect(bytes[0] == 1)
      #expect(bytes[3] == 4)
    }
  }

  @Test
  func `withUnsafeBufferPointer reads elements with typed access`() throws {
    let typedArray = try runtime.eval("new Int32Array([-1, 2, -3, 4])").getTypedArray()

    typedArray.withUnsafeBufferPointer(as: Int32.self) { elements in
      #expect(elements.count == typedArray.length)
      #expect(elements[0] == -1)
      #expect(elements[1] == 2)
      #expect(elements[2] == -3)
      #expect(elements[3] == 4)
    }
  }

  @Test
  func `writes through withUnsafeMutableBufferPointer are visible in JS`() throws {
    let value = try runtime.eval("new Int32Array(3)")
    let typedArray = value.getTypedArray()

    typedArray.withUnsafeMutableBufferPointer(as: Int32.self) { elements in
      elements[0] = -100
      elements[1] = 0
      elements[2] = Int32.max
    }

    let result = try runtime.eval("val => [val[0], val[1], val[2]]").getFunction().call(arguments: value).getArray()
    #expect(result[0].getInt() == -100)
    #expect(result[1].getInt() == 0)
    #expect(Int32(result[2].getInt()) == Int32.max)
  }

  @Test
  func `withUnsafeBytes covers view range, not full buffer`() throws {
    let typedArray = try runtime.eval("""
      var buf = new ArrayBuffer(16);
      new Uint8Array(buf).fill(0xAA);
      new Uint8Array(buf, 4, 8)
    """).getTypedArray()

    #expect(typedArray.byteOffset == 4)
    #expect(typedArray.byteLength == 8)

    typedArray.withUnsafeBytes { bytes in
      #expect(bytes.count == 8)
      for byte in bytes {
        #expect(byte == 0xAA)
      }
    }
  }

  // MARK: - asValue round-trip

  @Test
  func `asValue produces a valid typed array value`() throws {
    let original = try runtime.eval("new Uint8Array([10, 20, 30])")
    let typedArray = original.getTypedArray()

    let value = typedArray.asValue()

    #expect(value.isTypedArray() == true)
    #expect(value.getTypedArray().length == 3)
    #expect(value.getTypedArray().getProperty("0").getInt() == 10)
  }

  @Test
  func `asValue round-trip preserves kind`() throws {
    let kinds: [(String, JavaScriptTypedArray.Kind)] = [
      ("new Int16Array([1, 2])", .Int16Array),
      ("new Float32Array([1.5])", .Float32Array),
      ("new Float64Array([3.14])", .Float64Array),
      ("new Uint32Array([100])", .Uint32Array),
    ]

    for (js, expectedKind) in kinds {
      let typedArray = try runtime.eval(js).getTypedArray()
      let roundTripped = typedArray.asValue().getTypedArray()
      #expect(roundTripped.kind == expectedKind)
    }
  }

  // MARK: - getArrayBuffer

  @Test
  func `getArrayBuffer returns underlying buffer`() throws {
    let typedArray = try runtime.eval("new Uint8Array([1, 2, 3, 4])").getTypedArray()
    let buffer = typedArray.getArrayBuffer()

    #expect(buffer.size == 4)
    #expect(buffer.data()[0] == 1)
    #expect(buffer.data()[3] == 4)
  }

  @Test
  func `getArrayBuffer respects offset`() throws {
    let typedArray = try runtime.eval("""
      var buf = new ArrayBuffer(8);
      new Uint8Array(buf, 2, 4)
    """).getTypedArray()
    let buffer = typedArray.getArrayBuffer()

    #expect(typedArray.byteOffset == 2)
    #expect(typedArray.length == 4)
    #expect(buffer.size == 8)
  }

  @Test
  func `TypedArray and ArrayBuffer share memory`() throws {
    let value = try runtime.eval("new Uint8Array([10, 20, 30])")
    let typedArray = value.getTypedArray()
    let buffer = typedArray.getArrayBuffer()

    // Write through the ArrayBuffer's raw pointer
    buffer.data()[1] = 99

    // Read back through the TypedArray in JS
    let updated = try runtime.eval("val => val[1]").getFunction().call(arguments: value)
    #expect(updated.getInt() == 99)
  }
}
