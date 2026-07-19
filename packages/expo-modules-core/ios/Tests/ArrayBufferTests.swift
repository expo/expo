// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
import Testing

@testable import ExpoModulesCore

@Suite("ArrayBuffer", .serialized)
struct ArrayBufferTests {

  // MARK: - Allocation

  @Suite("allocation")
  struct AllocationTests {
    @Test
    func `allocates with specified size`() {
      let size = 1024
      let buffer = NativeArrayBuffer.allocate(size: size)

      #expect(buffer.byteLength == size)
      #expect(buffer.isNativeBacked == true)
    }

    @Test
    func `initializes to zero when requested`() {
      let size = 100
      let buffer = NativeArrayBuffer.allocate(size: size, initializeToZero: true)

      #expect(buffer.data.allSatisfy { $0 == 0 } == true)
    }
  }

  // MARK: - Data wrapping

  @Suite("data wrapping")
  struct DataWrappingTests {
    @Test
    func `wraps UnsafeMutableRawBufferPointer`() throws {
      let size = 10
      let memory = UnsafeMutableRawPointer.allocate(byteCount: size, alignment: 1)
      let buffer = UnsafeMutableRawBufferPointer(start: memory, count: size)

      var cleanupCalled = false
      let arrayBuffer = try NativeArrayBuffer.wrap(
        dataWithoutCopy: buffer,
        cleanup: {
          memory.deallocate()
          cleanupCalled = true
        }
      )

      #expect(arrayBuffer.byteLength == size)
      #expect(arrayBuffer.isNativeBacked == true)
      #expect(cleanupCalled == false)
    }
  }

  // MARK: - Copying

  @Suite("copying")
  struct CopyingTests {
    @Test
    func `copies from UnsafeRawPointer`() {
      let originalData: [UInt8] = [10, 20, 30, 40, 50]
      let copiedBuffer = originalData.withUnsafeBytes { ptr in
        NativeArrayBuffer.copy(of: ptr.baseAddress!, count: originalData.count)
      }

      #expect(copiedBuffer.byteLength == originalData.count)
      #expect(copiedBuffer.isNativeBacked == true)
      #expect(Array(copiedBuffer.data) == originalData)
    }

    @Test
    func `copies from Data`() throws {
      let originalData = Data([1, 2, 3, 4, 5, 6, 7, 8])
      let copiedBuffer = try NativeArrayBuffer.copy(data: originalData)

      #expect(copiedBuffer.byteLength == originalData.count)
      #expect(copiedBuffer.isNativeBacked == true)
      #expect(copiedBuffer.data == originalData)
    }

    @Test
    func `copies from another NativeArrayBuffer`() {
      let originalBuffer = NativeArrayBuffer.allocate(size: 50, initializeToZero: true)
      // Write some test data via withUnsafeMutableBytes
      let testBytes: [UInt8] = [1, 2, 3, 4, 5]
      originalBuffer.withUnsafeMutableBytes { ptr in
        memcpy(ptr.baseAddress!, testBytes, testBytes.count)
      }

      let copiedBuffer = originalBuffer.copy()

      #expect(copiedBuffer.byteLength == originalBuffer.byteLength)
      #expect(copiedBuffer.isNativeBacked == true)

      // Verify content is the same
      let originalFirst5 = Array(originalBuffer.data.prefix(5))
      let copiedFirst5 = Array(copiedBuffer.data.prefix(5))
      #expect(copiedFirst5 == originalFirst5)
    }
  }

  // MARK: - Data conversion

  @Suite("data conversion")
  struct DataConversionTests {
    @Test
    func `converts to Data`() {
      let testData: [UInt8] = [1, 2, 3, 4, 5]
      let buffer = NativeArrayBuffer.allocate(size: testData.count)
      buffer.withUnsafeMutableBytes { ptr in
        memcpy(ptr.baseAddress!, testData, testData.count)
      }

      let convertedData = buffer.data
      #expect(convertedData.count == testData.count)
      #expect(Array(convertedData) == testData)
    }

    @Test
    func `conforms to ContiguousBytes`() {
      let testData: [UInt8] = [1, 2, 3, 4, 5, 6, 7, 8]
      let buffer = NativeArrayBuffer.allocate(size: testData.count)
      buffer.withUnsafeMutableBytes { ptr in
        memcpy(ptr.baseAddress!, testData, testData.count)
      }

      let extractedBytes = buffer.withUnsafeBytes { ptr in
        Array(ptr.bindMemory(to: UInt8.self))
      }

      #expect(extractedBytes == testData)
    }
  }

  // MARK: - JavaScript integration

  @Suite("JavaScript integration")
  @JavaScriptActor
  struct JavaScriptIntegrationTests {
    let appContext: AppContext
    var runtime: ExpoRuntime {
      get throws {
        try appContext.runtime
      }
    }

    init() {
      appContext = AppContext.create()
      appContext.moduleRegistry.register(moduleType: ArrayBufferTestModule.self, name: "ArrayBufferTests")
    }

    @Test
    func `creates ArrayBuffer from JavaScript`() throws {
      let jsArrayBuffer = try runtime.eval("new ArrayBuffer(16)").asArrayBuffer()
      let arrayBuffer = try runtime.eval("expo.modules.ArrayBufferTests.createFromJS(new ArrayBuffer(16))")
        .asArrayBuffer()

      #expect(jsArrayBuffer.byteLength == 16)
      #expect(arrayBuffer.byteLength == 16)
    }

    @Test
    func `round trips an empty ArrayBuffer without losing identity`() throws {
      let appContext = AppContext.create()
      appContext.moduleRegistry.register(moduleType: ArrayBufferTestModule.self, name: "ArrayBufferTests")
      let runtime = try appContext.runtime

      #expect(runtime.isOnJavaScriptThread() == true)
      let result = try runtime.eval(
        """
        const buffer = new ArrayBuffer(0)
        buffer === expo.modules.ArrayBufferTests.createFromJS(buffer)
        """
      ).asBool()

      #expect(result == true)
    }

    @Test
    func `round trips an empty full-range typed-array view without losing identity`() throws {
      let appContext = AppContext.create()
      appContext.moduleRegistry.register(moduleType: ArrayBufferTestModule.self, name: "ArrayBufferTests")
      let runtime = try appContext.runtime

      #expect(runtime.isOnJavaScriptThread() == true)
      let result = try runtime.eval(
        """
        const buffer = new ArrayBuffer(0)
        const view = new Uint8Array(buffer, 0, 0)
        buffer === expo.modules.ArrayBufferTests.createFromJS(view)
        """
      ).asBool()

      #expect(result == true)
    }

    @Test
    func `ArrayBuffer argument accepts full typed arrays`() throws {
      let result = try runtime.eval(
        """
        typedArray = new Uint8Array([42, 84])
        expo.modules.ArrayBufferTests.readBytesAsArray(typedArray, 2)
        """
      ).asArray()

      #expect(try result.getValue(at: 0).asInt() == 42)
      #expect(try result.getValue(at: 1).asInt() == 84)
    }

    @Test
    func `JavaScriptArrayBuffer accepts partial typed array view`() throws {
      let result = try runtime.eval(
        """
        arrayBuffer = new Uint8Array([1,2,3,4,5]).buffer
        view = new Uint8Array(arrayBuffer, 1, 2)
        expo.modules.ArrayBufferTests.readBytesAsArray(view, 2)
        """
      ).asArray()

      #expect(try result.getValue(at: 0).asInt() == 2)
      #expect(try result.getValue(at: 1).asInt() == 3)
    }

    @Test
    func `NativeArrayBuffer accepts partial typed array view`() throws {
      let result = try runtime.eval(
        """
        view = new Uint8Array(new Uint8Array([1,2,3,4,5]).buffer, 1, 2)
        expo.modules.ArrayBufferTests.readNativeBufferBytesAsArray(view, 2)
        """
      ).asArray()

      #expect(try result.getValue(at: 0).asInt() == 2)
      #expect(try result.getValue(at: 1).asInt() == 3)
    }

    @Test
    func `returns ArrayBuffer to JavaScript`() throws {
      let buffer = try runtime.eval("expo.modules.ArrayBufferTests.createNative(32)").asArrayBuffer()

      #expect(buffer.byteLength == 32)
    }

    @Test
    func `reads and writes through JavaScript`() throws {
      // Create buffer and write data through JavaScript
      let buffer = try runtime.eval(
        """
        buffer = expo.modules.ArrayBufferTests.createNative(10)
        view = new Uint8Array(buffer)
        view[0] = 42
        view[1] = 84
        buffer
        """
      ).asArrayBuffer()

      // Read back the data we wrote
      let result = try runtime.eval("expo.modules.ArrayBufferTests.readBytesAsArray(buffer, 2)").asArray()

      #expect(try result.getValue(at: 0).asInt() == 42)
      #expect(try result.getValue(at: 1).asInt() == 84)
      #expect(buffer.byteLength == 10)
    }

    @Test
    func `maintains data consistency between native and JS`() throws {
      // Create buffer and fill with pattern from native
      let buffer = try runtime.eval(
        """
        buffer = expo.modules.ArrayBufferTests.createNative(5)
        expo.modules.ArrayBufferTests.fillWithPattern(buffer, 170)
        buffer
        """
      ).asArrayBuffer()

      // Read back through JavaScript
      let values = try runtime.eval(
        """
        view = new Uint8Array(buffer)
        Array.from(view)
        """
      ).asArray().map { try $0.asInt() }

      #expect(buffer.byteLength == 5)
      #expect(values.allSatisfy { $0 == 170 } == true)
    }

    @Test
    func `copies buffer when using legacy NativeArrayBuffer argument`() throws {
      // Create original buffer with initial pattern
      let originalBuffer = try runtime.eval(
        """
        originalBuffer = new ArrayBuffer(4)
        originalView = new Uint8Array(originalBuffer)
        originalView.fill(42)
        originalBuffer
        """
      ).asArrayBuffer()

      // Process through native function that represents the legacy NativeArrayBuffer path (creates copy)
      let processedBuffer = try runtime.eval(
        """
        processedBuffer = expo.modules.ArrayBufferTests.processNativeBuffer(originalBuffer, 99)
        processedBuffer
        """
      ).asArrayBuffer()

      // Check that original buffer is unchanged
      let originalValues = try runtime.eval("Array.from(new Uint8Array(originalBuffer))")
        .asArray().map { try $0.asInt() }

      // Check that processed buffer has new pattern
      let processedValues = try runtime.eval("Array.from(new Uint8Array(processedBuffer))")
        .asArray().map { try $0.asInt() }

      #expect(originalBuffer.byteLength == 4)
      #expect(processedBuffer.byteLength == 4)
      #expect(originalValues.allSatisfy { $0 == 42 } == true)  // Original unchanged
      #expect(processedValues.allSatisfy { $0 == 99 } == true)  // Processed has new pattern
    }

    @Test
    func `detaches JS-backed ArrayBuffer when using unscoped mutable bytes API`() throws {
      let processedBuffer = try runtime.eval(
        """
        originalBuffer = new ArrayBuffer(4)
        originalView = new Uint8Array(originalBuffer)
        originalView.fill(42)
        isNativeBacked = expo.modules.ArrayBufferTests.isNativeBacked(originalBuffer)
        processedBuffer = expo.modules.ArrayBufferTests.processBuffer(originalBuffer, 99)
        processedBuffer
        """
      ).asArrayBuffer()

      let originalValues = try runtime.eval("Array.from(originalView)")
        .asArray().map { try $0.asInt() }

      let processedValues = try runtime.eval("Array.from(new Uint8Array(processedBuffer))")
        .asArray().map { try $0.asInt() }

      #expect(processedBuffer.byteLength == 4)
      #expect(try runtime.eval("isNativeBacked").asBool() == false)
      #expect(originalValues == [42, 42, 42, 42])
      #expect(processedValues == [99, 99, 99, 99])
    }

    @Test
    func `shares native-backed ArrayBuffer when using ArrayBuffer argument`() throws {
      let processedBuffer = try runtime.eval(
        """
        nativeBackedBuffer = expo.modules.ArrayBufferTests.createNative(4)
        new Uint8Array(nativeBackedBuffer).fill(42)
        isNativeBacked = expo.modules.ArrayBufferTests.isNativeBacked(nativeBackedBuffer)
        processedBuffer = expo.modules.ArrayBufferTests.processBuffer(nativeBackedBuffer, 99)
        processedBuffer
        """
      ).asArrayBuffer()

      let originalValues = try runtime.eval("Array.from(new Uint8Array(nativeBackedBuffer))")
        .asArray().map { try $0.asInt() }

      let processedValues = try runtime.eval("Array.from(new Uint8Array(processedBuffer))")
        .asArray().map { try $0.asInt() }

      #expect(processedBuffer.byteLength == 4)
      #expect(try runtime.eval("isNativeBacked").asBool() == true)
      #expect(originalValues == [99, 99, 99, 99])
      #expect(processedValues == [99, 99, 99, 99])
    }

    @Test
    func `shares native-backed typed array view when using ArrayBuffer argument`() throws {
      let processedBuffer = try runtime.eval(
        """
        nativeBackedBuffer = expo.modules.ArrayBufferTests.createNative(5)
        fullView = new Uint8Array(nativeBackedBuffer)
        fullView.set([1, 2, 3, 4, 5])
        partialView = new Uint8Array(nativeBackedBuffer, 1, 2)
        isNativeBacked = expo.modules.ArrayBufferTests.isNativeBacked(partialView)
        processedBuffer = expo.modules.ArrayBufferTests.processBuffer(partialView, 99)
        processedBuffer
        """
      ).asArrayBuffer()

      let originalValues = try runtime.eval("Array.from(new Uint8Array(nativeBackedBuffer))")
        .asArray().map { try $0.asInt() }

      let processedValues = try runtime.eval("Array.from(new Uint8Array(processedBuffer))")
        .asArray().map { try $0.asInt() }

      #expect(processedBuffer.byteLength == 2)
      #expect(try runtime.eval("isNativeBacked").asBool() == true)
      #expect(originalValues == [1, 99, 99, 4, 5])
      #expect(processedValues == [99, 99])
    }

    @Test
    func `detaches JS-backed typed array view when using unscoped mutable bytes API`() throws {
      let processedBuffer = try runtime.eval(
        """
        jsBackedBuffer = new Uint8Array([1, 2, 3, 4, 5]).buffer
        fullView = new Uint8Array(jsBackedBuffer)
        partialView = new Uint8Array(jsBackedBuffer, 1, 2)
        isNativeBacked = expo.modules.ArrayBufferTests.isNativeBacked(partialView)
        processedBuffer = expo.modules.ArrayBufferTests.processBuffer(partialView, 99)
        processedBuffer
        """
      ).asArrayBuffer()

      let originalValues = try runtime.eval("Array.from(fullView)")
        .asArray().map { try $0.asInt() }

      let processedValues = try runtime.eval("Array.from(new Uint8Array(processedBuffer))")
        .asArray().map { try $0.asInt() }

      #expect(processedBuffer.byteLength == 2)
      #expect(try runtime.eval("isNativeBacked").asBool() == false)
      #expect(originalValues == [1, 2, 3, 4, 5])
      #expect(processedValues == [99, 99])
    }

    @Test
    func `withJSBytes reads JS-backed ArrayBuffer without detaching`() throws {
      let result = try runtime.eval([
        "(() => {",
        "const buffer = new Uint8Array([1, 2, 3, 4]).buffer",
        "const view = new Uint8Array(buffer)",
        "const initialBytes = expo.modules.ArrayBufferTests.readWithJSBytes(buffer, 4)",
        "view[0] = 9",
        "const updatedBytes = expo.modules.ArrayBufferTests.readWithJSBytes(buffer, 4)",
        "return [initialBytes, updatedBytes, expo.modules.ArrayBufferTests.isNativeBacked(buffer)]",
        "})()",
      ]).asArray()

      let before = try result.getValue(at: 0).asArray().map { try $0.asInt() }
      let after = try result.getValue(at: 1).asArray().map { try $0.asInt() }

      #expect(before == [1, 2, 3, 4])
      #expect(after == [9, 2, 3, 4])
      #expect(try result.getValue(at: 2).asBool() == false)
    }

    @Test
    func `withUnsafeBytes keeps JS-backed reads transient`() throws {
      let backingValue = try runtime.eval("globalThis.arrayBufferUnderTest = new Uint8Array([1, 2, 3, 4]).buffer")
      let buffer = try ArrayBuffer.decode(backingValue, in: runtime)

      #expect(buffer.isNativeBacked == false)
      #expect(buffer.withUnsafeBytes { Array($0) } == [1, 2, 3, 4])

      _ = try runtime.eval("new Uint8Array(globalThis.arrayBufferUnderTest)[0] = 9")

      #expect(buffer.withUnsafeBytes { Array($0) } == [9, 2, 3, 4])
      #expect(buffer.isNativeBacked == false)
    }

    @Test
    func `copy keeps JS-backed source transient`() throws {
      let backingValue = try runtime.eval("globalThis.arrayBufferUnderTest = new Uint8Array([1, 2, 3, 4]).buffer")
      let buffer = try ArrayBuffer.decode(backingValue, in: runtime)

      #expect(buffer.isNativeBacked == false)

      let copy = buffer.copy()

      #expect(Array(copy.data) == [1, 2, 3, 4])
      #expect(copy.isNativeBacked == true)
      #expect(buffer.isNativeBacked == false)

      _ = try runtime.eval("new Uint8Array(globalThis.arrayBufferUnderTest)[0] = 9")

      #expect(Array(copy.data) == [1, 2, 3, 4])
      #expect(try buffer.withJSBytes { Array($0) } == [9, 2, 3, 4])
      #expect(buffer.isNativeBacked == false)
    }

    @Test
    func `withJSBytes reads JS-backed typed array view range`() throws {
      let values = try runtime.eval([
        "buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer",
        "view = new Uint8Array(buffer, 1, 2)",
        "expo.modules.ArrayBufferTests.readWithJSBytes(view, 2)",
      ]).asArray().map { try $0.asInt() }

      #expect(values == [2, 3])
    }

    @Test
    func `withMutableJSBytes mutates original JS-backed ArrayBuffer`() throws {
      let values = try runtime.eval([
        "buffer = new Uint8Array([1, 2, 3, 4]).buffer",
        "expo.modules.ArrayBufferTests.fillWithMutableJSBytes(buffer, 7)",
        "Array.from(new Uint8Array(buffer))",
      ]).asArray().map { try $0.asInt() }

      #expect(values == [7, 7, 7, 7])
    }

    @Test
    func `withMutableJSBytes mutates original JS-backed typed array view range`() throws {
      let values = try runtime.eval([
        "buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer",
        "view = new Uint8Array(buffer, 1, 2)",
        "expo.modules.ArrayBufferTests.fillWithMutableJSBytes(view, 7)",
        "Array.from(new Uint8Array(buffer))",
      ]).asArray().map { try $0.asInt() }

      #expect(values == [1, 7, 7, 4, 5])
    }

    @Test
    func `withJSBytes and withMutableJSBytes work for native-backed storage`() throws {
      let result = try runtime.eval([
        "(() => {",
        "const buffer = expo.modules.ArrayBufferTests.createNative(3)",
        "new Uint8Array(buffer).set([1, 2, 3])",
        "const initialBytes = expo.modules.ArrayBufferTests.readWithJSBytes(buffer, 3)",
        "expo.modules.ArrayBufferTests.fillWithMutableJSBytes(buffer, 8)",
        "const updatedBytes = Array.from(new Uint8Array(buffer))",
        "return [initialBytes, updatedBytes]",
        "})()",
      ]).asArray()

      let before = try result.getValue(at: 0).asArray().map { try $0.asInt() }
      let after = try result.getValue(at: 1).asArray().map { try $0.asInt() }

      #expect(before == [1, 2, 3])
      #expect(after == [8, 8, 8])
    }

    @Test
    func `withUnsafeMutableBytes allows reentrant access to the same buffer`() async throws {
      let buffer = ArrayBuffer(size: 4)

      try await runOffThreadWithTimeout {
        buffer.withUnsafeMutableBytes { ptr in
          ptr.initializeMemory(as: UInt8.self, repeating: 7)

          #expect(buffer.byteLength == 4)
          #expect(Array(buffer.data) == [7, 7, 7, 7])
        }
      }
    }

    @Test
    func `drops JS-backed ArrayBuffer retained value off JavaScript thread`() async throws {
      let runtime = try runtime
      let value = try runtime.eval("new Uint8Array([1, 2, 3]).buffer")
      var buffer: ArrayBuffer? = try ArrayBuffer.decode(value, in: runtime)

      #expect(runtime.longLivedObjects.count == 1)

      let box = ArrayBufferOptionalBox(buffer)
      buffer = nil

      try await runOffThreadWithTimeout {
        box.buffer = nil
      }

      try await runtime.execute {}
      #expect(runtime.longLivedObjects.count == 0)
    }

    @Test
    func `runtime teardown sweep releases outstanding JS-backed ArrayBuffer retained values`() throws {
      let runtime = try runtime
      let value = try runtime.eval("new Uint8Array([1, 2, 3]).buffer")
      let buffer = try ArrayBuffer.decode(value, in: runtime)

      #expect(buffer.isNativeBacked == false)
      #expect(runtime.longLivedObjects.count == 1)

      runtime.longLivedObjects.clear()

      #expect(runtime.longLivedObjects.count == 0)
      #expect(throws: ArrayBufferJSBytesAccessException.self) {
        try buffer.withJSBytes { bytes in
          Array(bytes)
        }
      }
      #expect(throws: ArrayBufferJSBytesAccessException.self) {
        _ = try buffer.makeOwnedNativeStorageCopy()
      }
    }

    @Test
    func `JS-backed ArrayBuffer view throws when its captured range exceeds the backing buffer`() throws {
      let runtime = try runtime
      let backingValue = try runtime.eval("new ArrayBuffer(0)")

      // This Hermes test runtime has no `structuredClone`, `ArrayBuffer#transfer`, or
      // `HermesInternal.detachArrayBuffer`. A transferred buffer presents this same stale
      // captured-range condition, so construct it directly to exercise `validateBounds()`.
      let view = JavaScriptBackedArrayBufferView(
        runtime: runtime,
        backingValue: backingValue,
        byteOffset: 0,
        byteLength: 3
      )

      #expect(throws: ArrayBufferJSBytesAccessException.self) {
        try view.withUnsafeBytes { bytes in
          Array(bytes)
        }
      }
      #expect(throws: ArrayBufferJSBytesAccessException.self) {
        _ = try view.makeOwnedNativeStorageCopy()
      }
    }

    @Test
    func `encoding full JS-backed ArrayBuffer preserves identity on JavaScript thread`() throws {
      // Construct the standalone runtime on this synchronous test thread so its recorded JS
      // thread is the thread that performs the identity-sensitive encode.
      let runtime = ExpoRuntime()
      let value = try runtime.eval("new Uint8Array([1, 2, 3]).buffer")
      let buffer = try ArrayBuffer.decode(value, in: runtime)
      let encoded = buffer.asJavaScriptArrayBuffer(runtime: runtime).asValue()

      runtime.global().setProperty("originalBuffer", value: value)
      runtime.global().setProperty("encodedBuffer", value: encoded)

      #expect(try runtime.eval("originalBuffer === encodedBuffer").asBool() == true)
    }

    @Test
    func `encoding partial JS-backed ArrayBuffer view copies visible range`() throws {
      let runtime = try runtime
      let value = try runtime.eval([
        "const buffer = new Uint8Array([1, 2, 3, 4]).buffer",
        "new Uint8Array(buffer, 1, 2)",
      ])
      let buffer = try ArrayBuffer.decode(value, in: runtime)
      let encoded = buffer.asJavaScriptArrayBuffer(runtime: runtime).asValue()

      runtime.global().setProperty("encodedBuffer", value: encoded)
      let bytes = try runtime.eval("Array.from(new Uint8Array(encodedBuffer))").asArray().map { try $0.asInt() }

      #expect(bytes == [2, 3])
    }

    @Test
    func `shares native-backed buffer when using legacy NativeArrayBuffer argument`() throws {
      let processedBuffer = try runtime.eval(
        """
        nativeBackedBuffer = expo.modules.ArrayBufferTests.createNative(4)
        new Uint8Array(nativeBackedBuffer).fill(42)
        processedBuffer = expo.modules.ArrayBufferTests.processNativeBuffer(nativeBackedBuffer, 99)
        processedBuffer
        """
      ).asArrayBuffer()

      let originalValues = try runtime.eval("Array.from(new Uint8Array(nativeBackedBuffer))")
        .asArray().map { try $0.asInt() }

      let processedValues = try runtime.eval("Array.from(new Uint8Array(processedBuffer))")
        .asArray().map { try $0.asInt() }

      #expect(processedBuffer.byteLength == 4)
      #expect(originalValues.allSatisfy { $0 == 99 } == true)
      #expect(processedValues.allSatisfy { $0 == 99 } == true)
    }

    @Test
    func `shares native-backed typed array view when using legacy NativeArrayBuffer argument`() throws {
      let processedBuffer = try runtime.eval(
        """
        nativeBackedBuffer = expo.modules.ArrayBufferTests.createNative(5)
        fullView = new Uint8Array(nativeBackedBuffer)
        fullView.set([1, 2, 3, 4, 5])
        partialView = new Uint8Array(nativeBackedBuffer, 1, 2)
        processedBuffer = expo.modules.ArrayBufferTests.processNativeBuffer(partialView, 99)
        processedBuffer
        """
      ).asArrayBuffer()

      let originalValues = try runtime.eval("Array.from(new Uint8Array(nativeBackedBuffer))")
        .asArray().map { try $0.asInt() }

      let processedValues = try runtime.eval("Array.from(new Uint8Array(processedBuffer))")
        .asArray().map { try $0.asInt() }

      #expect(processedBuffer.byteLength == 2)
      #expect(originalValues == [1, 99, 99, 4, 5])
      #expect(processedValues == [99, 99])
    }

    @Test
    func `copies JS-backed typed array view when using legacy NativeArrayBuffer argument`() throws {
      let processedBuffer = try runtime.eval(
        """
        jsBackedBuffer = new Uint8Array([1, 2, 3, 4, 5]).buffer
        fullView = new Uint8Array(jsBackedBuffer)
        partialView = new Uint8Array(jsBackedBuffer, 1, 2)
        processedBuffer = expo.modules.ArrayBufferTests.processNativeBuffer(partialView, 99)
        processedBuffer
        """
      ).asArrayBuffer()

      let originalValues = try runtime.eval("Array.from(fullView)")
        .asArray().map { try $0.asInt() }

      let processedValues = try runtime.eval("Array.from(new Uint8Array(processedBuffer))")
        .asArray().map { try $0.asInt() }

      #expect(processedBuffer.byteLength == 2)
      #expect(originalValues == [1, 2, 3, 4, 5])
      #expect(processedValues == [99, 99])
    }
  }

  // MARK: - Error handling

  @Suite("error handling")
  struct ErrorHandlingTests {
    @Test
    func `throws when wrapping invalid buffer pointer`() {
      #expect(throws: (any Error).self) {
        let emptyBuffer = UnsafeMutableRawBufferPointer(start: nil, count: 0)
        _ = try NativeArrayBuffer.wrap(dataWithoutCopy: emptyBuffer, cleanup: {})
      }
    }

    @Test
    func `does not throw when copying from empty Data`() throws {
      let emptyData = Data()
      _ = try NativeArrayBuffer.copy(data: emptyData)
    }
  }

  @Suite("concurrent materialization")
  @JavaScriptActor
  struct ConcurrentMaterializationTests {
    @Test
    func `concurrent materializers publish one native storage and clean up the loser`() async throws {
      let runtime = JavaScriptRuntime()
      let backingValue = try runtime.eval("new ArrayBuffer(1)")
      let sourceView = JavaScriptBackedArrayBufferView(
        runtime: runtime,
        backingValue: backingValue,
        byteOffset: 0,
        byteLength: 1)
      let storage = SynchronizedArrayBufferStorage(
        .javaScriptBacked(sourceView))
      let firstCleanup = ArrayBufferStorageCleanupCounter()
      let secondCleanup = ArrayBufferStorageCleanupCounter()
      let firstCandidate = makeOwnedNativeStorage(bytes: [0xa1], cleanupCounter: firstCleanup)
      let secondCandidate = makeOwnedNativeStorage(bytes: [0xb2], cleanupCounter: secondCleanup)
      let startBarrier = ArrayBufferTwoWorkerStartBarrier()

      #expect(storage.currentStorage().isNativeBacked == false)

      let first = Task.detached {
        await startBarrier.wait()
        storage.publishMaterializedStorage(firstCandidate)
      }
      let second = Task.detached {
        await startBarrier.wait()
        storage.publishMaterializedStorage(secondCandidate)
      }

      let firstPublished = await first.value
      let secondPublished = await second.value
      try withExtendedLifetime(storage) {
        try withExtendedLifetime(sourceView) {
          let firstNativeStorage = try #require(firstPublished.nativeStorage)
          let secondNativeStorage = try #require(secondPublished.nativeStorage)
          let firstBytes = Array(
            UnsafeRawBufferPointer(start: firstNativeStorage.pointer, count: firstNativeStorage.byteLength))
          let secondBytes = Array(
            UnsafeRawBufferPointer(start: secondNativeStorage.pointer, count: secondNativeStorage.byteLength))

          #expect(firstNativeStorage.pointer == secondNativeStorage.pointer)
          #expect(firstBytes == secondBytes)

          if firstBytes == [0xa1] {
            #expect(firstCleanup.count == 0)
            #expect(secondCleanup.count == 1)
          } else {
            #expect(firstBytes == [0xb2])
            #expect(firstCleanup.count == 1)
            #expect(secondCleanup.count == 0)
          }
        }
      }
    }

  }

  // MARK: - Memory management

  @Suite("memory management")
  struct MemoryManagementTests {
    @Test
    func `properly manages memory lifecycle`() {
      var cleanupCallCount = 0

      autoreleasepool {
        let memory = UnsafeMutableRawPointer.allocate(byteCount: 100, alignment: 1)
        let buffer = UnsafeMutableRawBufferPointer(start: memory, count: 100)

        _ = try! NativeArrayBuffer.wrap(
          dataWithoutCopy: buffer,
          cleanup: {
            memory.deallocate()
            cleanupCallCount += 1
          }
        )
      }

      #expect(cleanupCallCount > 0)
    }

    @Test
    func `handles zero-size buffers`() {
      let buffer = NativeArrayBuffer.allocate(size: 0)
      #expect(buffer.byteLength == 0)
    }

    @Test
    func `allows direct memory access via withUnsafeMutableBytes`() {
      let size = 1000
      let buffer = NativeArrayBuffer.allocate(size: size)

      let pattern: UInt8 = 0xAA
      buffer.withUnsafeMutableBytes { ptr in
        memset(ptr.baseAddress!, Int32(pattern), size)
      }

      #expect(buffer.data.allSatisfy { $0 == pattern } == true)
    }
  }
}

private struct ArrayBufferTestTimeout: Error {}

private final class ArrayBufferStorageCleanupCounter: @unchecked Sendable {
  private let lock = NSLock()
  private var cleanupCount = 0

  var count: Int {
    lock.lock()
    defer { lock.unlock() }
    return cleanupCount
  }

  func increment() {
    lock.lock()
    defer { lock.unlock() }
    cleanupCount += 1
  }
}

private actor ArrayBufferTwoWorkerStartBarrier {
  private var waitingWorkers: [CheckedContinuation<Void, Never>] = []

  func wait() async {
    await withCheckedContinuation { continuation in
      waitingWorkers.append(continuation)
      guard waitingWorkers.count == 2 else {
        return
      }

      let workers = waitingWorkers
      waitingWorkers.removeAll()
      for worker in workers {
        worker.resume()
      }
    }
  }
}

private func makeOwnedNativeStorage(
  bytes: [UInt8],
  cleanupCounter: ArrayBufferStorageCleanupCounter
) -> ArrayBufferStorage {
  let pointer = UnsafeMutableRawPointer.allocate(byteCount: bytes.count, alignment: 1)
  bytes.withUnsafeBytes { source in
    pointer.copyMemory(from: source.baseAddress!, byteCount: bytes.count)
  }
  return .ownedNative(
    NativeArrayBufferStorage(pointer: pointer, byteLength: bytes.count) {
      pointer.deallocate()
      cleanupCounter.increment()
    })
}

private final class ArrayBufferOptionalBox: @unchecked Sendable {
  var buffer: ArrayBuffer?

  init(_ buffer: ArrayBuffer?) {
    self.buffer = buffer
  }
}

private final class ArrayBufferTestContinuationState<R: Sendable>: @unchecked Sendable {
  private let lock = NSLock()
  private var continuation: CheckedContinuation<R, any Error>?

  init(_ continuation: CheckedContinuation<R, any Error>) {
    self.continuation = continuation
  }

  func resume(_ result: Result<R, any Error>) {
    lock.lock()
    defer { lock.unlock() }

    guard let continuation else {
      return
    }
    self.continuation = nil

    switch result {
    case .success(let value):
      continuation.resume(returning: value)
    case .failure(let error):
      continuation.resume(throwing: error)
    }
  }
}

private func runOffThreadWithTimeout<R: Sendable>(
  timeout: TimeInterval = 1,
  _ body: @escaping @Sendable () throws -> R
) async throws -> R {
  return try await withCheckedThrowingContinuation { continuation in
    let state = ArrayBufferTestContinuationState(continuation)

    Thread.detachNewThread {
      state.resume(
        Result {
          try body()
        })
    }

    DispatchQueue.global().asyncAfter(deadline: .now() + timeout) {
      state.resume(.failure(ArrayBufferTestTimeout()))
    }
  }
}

private final class ArrayBufferTestModule: Module {
  func definition() -> ModuleDefinition {
    Name("ArrayBufferTests")

    Function("createFromJS") { (buffer: ArrayBuffer) -> ArrayBuffer in
      return buffer
    }

    Function("createNative") { (size: Int) -> NativeArrayBuffer in
      return NativeArrayBuffer.allocate(size: size, initializeToZero: true)
    }

    Function("readBytesAsArray") { (buffer: ArrayBuffer, count: Int) -> [UInt8] in
      return Array(buffer.data.prefix(count))
    }

    Function("readNativeBufferBytesAsArray") { (buffer: NativeArrayBuffer, count: Int) -> [UInt8] in
      return Array(buffer.data.prefix(count))
    }

    Function("fillWithPattern") { (buffer: ArrayBuffer, pattern: UInt8) in
      buffer.withUnsafeMutableBytes { ptr in
        memset(ptr.baseAddress!, Int32(pattern), ptr.count)
      }
    }

    Function("isNativeBacked") { (buffer: ArrayBuffer) -> Bool in
      return buffer.isNativeBacked
    }

    Function("readWithJSBytes") { (buffer: ArrayBuffer, count: Int) throws -> [UInt8] in
      return try buffer.withJSBytes { ptr in
        return Array(ptr.prefix(count))
      }
    }

    Function("fillWithMutableJSBytes") { (buffer: ArrayBuffer, pattern: UInt8) throws in
      try buffer.withMutableJSBytes { ptr in
        memset(ptr.baseAddress!, Int32(pattern), ptr.count)
      }
    }

    Function("processNativeBuffer") { (buffer: NativeArrayBuffer, newPattern: UInt8) -> NativeArrayBuffer in
      buffer.withUnsafeMutableBytes { ptr in
        memset(ptr.baseAddress!, Int32(newPattern), ptr.count)
      }
      return buffer
    }

    Function("processBuffer") { (buffer: ArrayBuffer, newPattern: UInt8) -> ArrayBuffer in
      buffer.withUnsafeMutableBytes { ptr in
        memset(ptr.baseAddress!, Int32(newPattern), ptr.count)
      }
      return buffer
    }
  }
}
