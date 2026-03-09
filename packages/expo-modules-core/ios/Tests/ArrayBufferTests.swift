// Copyright 2022-present 650 Industries. All rights reserved.

import Foundation
import Testing

@testable import ExpoModulesCore

@Suite("ArrayBuffer")
struct ArrayBufferTests {
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

  // MARK: - Allocation

  @Suite("allocation")
  struct AllocationTests {
    @Test
    func `allocates with specified size`() {
      let size = 1024
      let buffer = ArrayBuffer.allocate(size: size)

      #expect(buffer.byteLength == size)
      #expect(buffer.rawPointer != nil)
    }

    @Test
    func `initializes to zero when requested`() {
      let size = 100
      let buffer = ArrayBuffer.allocate(size: size, initializeToZero: true)

      #expect(buffer.data.allSatisfy { $0 == 0 } == true)
    }
  }

  // MARK: - Data wrapping

  @Suite("data wrapping")
  struct DataWrappingTests {
    @Test
    func `wraps Data without copying`() {
      let originalData = Data([1, 2, 3, 4, 5])
      let buffer = ArrayBuffer.wrap(dataWithoutCopy: originalData)

      #expect(buffer.byteLength == originalData.count)

      let wrappedData = buffer.data
      #expect(wrappedData == originalData)
    }

    @Test
    func `wraps UnsafeMutableRawBufferPointer`() throws {
      let size = 10
      let memory = UnsafeMutableRawPointer.allocate(byteCount: size, alignment: 1)
      let buffer = UnsafeMutableRawBufferPointer(start: memory, count: size)

      var cleanupCalled = false
      let arrayBuffer = try ArrayBuffer.wrap(
        dataWithoutCopy: buffer,
        cleanup: {
          memory.deallocate()
          cleanupCalled = true
        }
      )

      #expect(arrayBuffer.byteLength == size)
      #expect(arrayBuffer.rawPointer == memory)
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
        ArrayBuffer.copy(of: ptr.baseAddress!, count: originalData.count)
      }

      #expect(copiedBuffer.byteLength == originalData.count)
      #expect(Array(copiedBuffer.data) == originalData)
    }

    @Test
    func `copies from UnsafeRawBufferPointer`() throws {
      let originalData: [UInt8] = [100, 200, 255]
      let copiedBuffer = try originalData.withUnsafeBytes { ptr in
        try ArrayBuffer.copy(of: ptr)
      }

      #expect(copiedBuffer.byteLength == originalData.count)
      #expect(Array(copiedBuffer.data) == originalData)
    }

    @Test
    func `copies from Data`() throws {
      let originalData = Data([1, 2, 3, 4, 5, 6, 7, 8])
      let copiedBuffer = try ArrayBuffer.copy(data: originalData)

      #expect(copiedBuffer.byteLength == originalData.count)
      #expect(copiedBuffer.data == originalData)
    }

    @Test
    func `copies from another ArrayBuffer`() {
      let originalBuffer = ArrayBuffer.allocate(size: 50, initializeToZero: true)
      // Write some test data
      let testBytes: [UInt8] = [1, 2, 3, 4, 5]
      memcpy(originalBuffer.rawPointer, testBytes, testBytes.count)

      let copiedBuffer = originalBuffer.copy()

      #expect(copiedBuffer.byteLength == originalBuffer.byteLength)
      #expect(copiedBuffer.rawPointer != originalBuffer.rawPointer) // Different memory locations

      // Verify content is the same
      let originalFirst5 = Data(bytes: originalBuffer.rawPointer, count: 5)
      let copiedFirst5 = Data(bytes: copiedBuffer.rawPointer, count: 5)
      #expect(copiedFirst5 == originalFirst5)
    }
  }

  // MARK: - Data conversion

  @Suite("data conversion")
  struct DataConversionTests {
    @Test
    func `converts to Data`() {
      let testData: [UInt8] = [1, 2, 3, 4, 5]
      let buffer = ArrayBuffer.allocate(size: testData.count)
      memcpy(buffer.rawPointer, testData, testData.count)

      let convertedData = buffer.data
      #expect(convertedData.count == testData.count)
      #expect(Array(convertedData) == testData)
    }

    @Test
    func `converts to NSMutableData`() {
      let testData: [UInt8] = [10, 20, 30]
      let buffer = ArrayBuffer.allocate(size: testData.count)
      memcpy(buffer.rawPointer, testData, testData.count)

      let mutableData = buffer.mutableData()
      #expect(mutableData.length == testData.count)

      let dataBytes = Data(bytes: mutableData.bytes, count: mutableData.length)
      #expect(Array(dataBytes) == testData)
    }

    @Test
    func `conforms to ContiguousBytes`() {
      let testData: [UInt8] = [1, 2, 3, 4, 5, 6, 7, 8]
      let buffer = ArrayBuffer.allocate(size: testData.count)
      memcpy(buffer.rawPointer, testData, testData.count)

      let extractedBytes = buffer.withUnsafeBytes { ptr in
        Array(ptr.bindMemory(to: UInt8.self))
      }

      #expect(extractedBytes == testData)
    }
  }

  // MARK: - JavaScript integration

  @Suite("JavaScript integration")
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
      let arrayBuffer = try runtime.eval("expo.modules.ArrayBufferTests.createFromJS(new ArrayBuffer(16))").asArrayBuffer()

      #expect(jsArrayBuffer.byteLength == 16)
      #expect(arrayBuffer.byteLength == 16)
    }

    @Test
    func `ArrayBuffer argument accepts full typed arrays`() throws {
      let result = try runtime.eval([
        "typedArray = new Uint8Array([42, 84])",
        "expo.modules.ArrayBufferTests.readBytesAsArray(typedArray, 2)"
      ]).asArray()

      #expect(try result[0]?.asInt() == 42)
      #expect(try result[1]?.asInt() == 84)
    }

    @Test
    func `JavaScriptArrayBuffer accepts partial typed array view`() throws {
      let result = try runtime.eval([
        "arrayBuffer = new Uint8Array([1,2,3,4,5]).buffer",
        "view = new Uint8Array(arrayBuffer, 1, 2)",
        "expo.modules.ArrayBufferTests.readBytesAsArray(view, 2)"
      ]).asArray()

      #expect(try result[0]?.asInt() == 2)
      #expect(try result[1]?.asInt() == 3)
    }

    @Test
    func `NativeArrayBuffer accepts partial typed array view`() throws {
      let result = try runtime.eval([
        "view = new Uint8Array(new Uint8Array([1,2,3,4,5]).buffer, 1, 2)",
        "expo.modules.ArrayBufferTests.readNativeBufferBytesAsArray(view, 2)"
      ]).asArray()

      #expect(try result[0]?.asInt() == 2)
      #expect(try result[1]?.asInt() == 3)
    }

    @Test
    func `returns ArrayBuffer to JavaScript`() throws {
      let buffer = try runtime.eval("expo.modules.ArrayBufferTests.createNative(32)").asArrayBuffer()

      #expect(buffer.byteLength == 32)
    }

    @Test
    func `reads and writes through JavaScript`() throws {
      // Create buffer and write data through JavaScript
      let buffer = try runtime.eval([
        "buffer = expo.modules.ArrayBufferTests.createNative(10)",
        "view = new Uint8Array(buffer)",
        "view[0] = 42",
        "view[1] = 84",
        "buffer"
      ]).asArrayBuffer()

      // Read back the data we wrote
      let result = try runtime.eval("expo.modules.ArrayBufferTests.readBytesAsArray(buffer, 2)").asArray()

      #expect(try result[0]?.asInt() == 42)
      #expect(try result[1]?.asInt() == 84)
      #expect(buffer.byteLength == 10)
    }

    @Test
    func `maintains data consistency between native and JS`() throws {
      // Create buffer and fill with pattern from native
      let buffer = try runtime.eval([
        "buffer = expo.modules.ArrayBufferTests.createNative(5)",
        "expo.modules.ArrayBufferTests.fillWithPattern(buffer, 170)", // 10101010 in binary
        "buffer"
      ]).asArrayBuffer()

      // Read back through JavaScript
      let values = try runtime.eval([
        "view = new Uint8Array(buffer)",
        "Array.from(view)"
      ]).asArray().map { try $0?.asInt() ?? 0 }

      #expect(buffer.byteLength == 5)
      #expect(values.allSatisfy { $0 == 170 } == true)
    }

    @Test
    func `copies buffer when using NativeArrayBuffer argument`() throws {
      // Create original buffer with initial pattern
      let originalBuffer = try runtime.eval([
        "originalBuffer = new ArrayBuffer(4)",
        "originalView = new Uint8Array(originalBuffer)",
        "originalView.fill(42)",
        "originalBuffer"
      ]).asArrayBuffer()

      // Process through native function that takes NativeArrayBuffer (creates copy)
      let processedBuffer = try runtime.eval([
        "processedBuffer = expo.modules.ArrayBufferTests.processNativeBuffer(originalBuffer, 99)",
        "processedBuffer"
      ]).asArrayBuffer()

      // Check that original buffer is unchanged
      let originalValues = try runtime.eval([
        "Array.from(new Uint8Array(originalBuffer))"
      ]).asArray().map { try $0?.asInt() ?? 0 }

      // Check that processed buffer has new pattern
      let processedValues = try runtime.eval([
        "Array.from(new Uint8Array(processedBuffer))"
      ]).asArray().map { try $0?.asInt() ?? 0 }

      #expect(originalBuffer.byteLength == 4)
      #expect(processedBuffer.byteLength == 4)
      #expect(originalValues.allSatisfy { $0 == 42 } == true)  // Original unchanged
      #expect(processedValues.allSatisfy { $0 == 99 } == true) // Processed has new pattern
    }
  }

  // MARK: - Error handling

  @Suite("error handling")
  struct ErrorHandlingTests {
    @Test
    func `throws when copying from invalid buffer pointer`() {
      #expect(throws: (any Error).self) {
        let emptyBuffer = UnsafeRawBufferPointer(start: nil, count: 0)
        _ = try ArrayBuffer.copy(of: emptyBuffer)
      }
    }

    @Test
    func `throws when wrapping invalid buffer pointer`() {
      #expect(throws: (any Error).self) {
        let emptyBuffer = UnsafeMutableRawBufferPointer(start: nil, count: 0)
        _ = try ArrayBuffer.wrap(dataWithoutCopy: emptyBuffer, cleanup: {})
      }
    }

    @Test
    func `does not throw when copying from empty Data`() throws {
      let emptyData = Data()
      _ = try ArrayBuffer.copy(data: emptyData)
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

        _ = try! ArrayBuffer.wrap(
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
      let buffer = ArrayBuffer.allocate(size: 0)
      #expect(buffer.byteLength == 0)
      #expect(buffer.rawPointer != nil)
    }

    @Test
    func `allows direct memory access`() {
      let size = 1000
      let buffer = ArrayBuffer.allocate(size: size)

      let pattern: UInt8 = 0xAA
      memset(buffer.rawPointer, Int32(pattern), size)

      #expect(buffer.data.allSatisfy { $0 == pattern } == true)
    }
  }
}

private final class ArrayBufferTestModule: Module {
  func definition() -> ModuleDefinition {
    Name("ArrayBufferTests")

    Function("createFromJS") { (jsArrayBuffer: JavaScriptArrayBuffer) -> ArrayBuffer in
      return jsArrayBuffer
    }

    Function("createNative") { (size: Int) -> NativeArrayBuffer in
      return ArrayBuffer.allocate(size: size, initializeToZero: true)
    }

    Function("readBytesAsArray") { (buffer: JavaScriptArrayBuffer, count: Int) -> [UInt8] in
      let data = Data(bytes: buffer.rawPointer, count: min(count, buffer.byteLength))
      return Array(data)
    }
    
    Function("readNativeBufferBytesAsArray") { (buffer: NativeArrayBuffer, count: Int) -> [UInt8] in
      let data = Data(bytes: buffer.rawPointer, count: min(count, buffer.byteLength))
      return Array(data)
    }

    Function("fillWithPattern") { (buffer: JavaScriptArrayBuffer, pattern: UInt8) in
      memset(buffer.rawPointer, Int32(pattern), buffer.byteLength)
    }

    Function("processNativeBuffer") { (buffer: NativeArrayBuffer, newPattern: UInt8) -> NativeArrayBuffer in
      memset(buffer.rawPointer, Int32(newPattern), buffer.byteLength)
      return buffer
    }
  }
}
