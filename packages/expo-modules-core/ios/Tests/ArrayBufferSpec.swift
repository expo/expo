// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesTestCore
import Foundation

@testable import ExpoModulesCore

final class ArrayBufferSpec: ExpoSpec {
  override class func spec() {
    describe("ArrayBuffer") {
      let appContext = AppContext.create()
      let runtime = try! appContext.runtime

      beforeSuite {
        appContext.moduleRegistry.register(moduleType: ArrayBufferTestModule.self, name: "ArrayBufferTests")
      }

      describe("allocation") {
        it("allocates with specified size") {
          let size = 1024
          let buffer = ArrayBuffer.allocate(size: size)

          expect(buffer.byteLength) == size
          expect(buffer.rawPointer).toNot(beNil())
        }

        it("initializes to zero when requested") {
          let size = 100
          let buffer = ArrayBuffer.allocate(size: size, initializeToZero: true)

          expect(buffer.data.allSatisfy { $0 == 0 }) == true
        }
      }

      describe("data wrapping") {
        it("wraps Data without copying") {
          let originalData = Data([1, 2, 3, 4, 5])
          let buffer = ArrayBuffer.wrap(dataWithoutCopy: originalData)

          expect(buffer.byteLength) == originalData.count

          let wrappedData = buffer.data
          expect(wrappedData) == originalData
        }

        it("wraps UnsafeMutableRawBufferPointer") {
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

          expect(arrayBuffer.byteLength) == size
          expect(arrayBuffer.rawPointer) == memory
          expect(cleanupCalled) == false
        }
      }

      describe("copying") {
        it("copies from UnsafeRawPointer") {
          let originalData: [UInt8] = [10, 20, 30, 40, 50]
          let copiedBuffer = originalData.withUnsafeBytes { ptr in
            ArrayBuffer.copy(of: ptr.baseAddress!, count: originalData.count)
          }

          expect(copiedBuffer.byteLength) == originalData.count
          expect(Array(copiedBuffer.data)) == originalData
        }

        it("copies from UnsafeRawBufferPointer") {
          let originalData: [UInt8] = [100, 200, 255]
          let copiedBuffer = try originalData.withUnsafeBytes { ptr in
            try ArrayBuffer.copy(of: ptr)
          }

          expect(copiedBuffer.byteLength) == originalData.count
          expect(Array(copiedBuffer.data)) == originalData
        }

        it("copies from Data") {
          let originalData = Data([1, 2, 3, 4, 5, 6, 7, 8])
          let copiedBuffer = try ArrayBuffer.copy(data: originalData)

          expect(copiedBuffer.byteLength) == originalData.count
          expect(copiedBuffer.data) == originalData
        }

        it("copies from another ArrayBuffer") {
          let originalBuffer = ArrayBuffer.allocate(size: 50, initializeToZero: true)
            // Write some test data
          let testBytes: [UInt8] = [1, 2, 3, 4, 5]
          memcpy(originalBuffer.rawPointer, testBytes, testBytes.count)

          let copiedBuffer = originalBuffer.copy()

          expect(copiedBuffer.byteLength) == originalBuffer.byteLength
          expect(copiedBuffer.rawPointer) != originalBuffer.rawPointer // Different memory locations

            // Verify content is the same
          let originalFirst5 = Data(bytes: originalBuffer.rawPointer, count: 5)
          let copiedFirst5 = Data(bytes: copiedBuffer.rawPointer, count: 5)
          expect(copiedFirst5) == originalFirst5
        }
      }

      describe("data conversion") {
        it("converts to Data") {
          let testData: [UInt8] = [1, 2, 3, 4, 5]
          let buffer = ArrayBuffer.allocate(size: testData.count)
          memcpy(buffer.rawPointer, testData, testData.count)

          let convertedData = buffer.data
          expect(convertedData.count) == testData.count
          expect(Array(convertedData)) == testData
        }

        it("converts to NSMutableData") {
          let testData: [UInt8] = [10, 20, 30]
          let buffer = ArrayBuffer.allocate(size: testData.count)
          memcpy(buffer.rawPointer, testData, testData.count)

          let mutableData = buffer.mutableData()
          expect(mutableData.length) == testData.count

          let dataBytes = Data(bytes: mutableData.bytes, count: mutableData.length)
          expect(Array(dataBytes)) == testData
        }

        it("conforms to ContiguousBytes") {
          let testData: [UInt8] = [1, 2, 3, 4, 5, 6, 7, 8]
          let buffer = ArrayBuffer.allocate(size: testData.count)
          memcpy(buffer.rawPointer, testData, testData.count)

          let extractedBytes = buffer.withUnsafeBytes { ptr in
            Array(ptr.bindMemory(to: UInt8.self))
          }

          expect(extractedBytes) == testData
        }
      }

      describe("JavaScript integration") {
        it("creates ArrayBuffer from JavaScript") {
          let jsArrayBuffer = try runtime.eval("new ArrayBuffer(16)").asArrayBuffer()
          let arrayBuffer = try runtime.eval("expo.modules.ArrayBufferTests.createFromJS(new ArrayBuffer(16))").asArrayBuffer()

          expect(jsArrayBuffer.byteLength) == 16
          expect(arrayBuffer.byteLength) == 16
        }

        it("returns ArrayBuffer to JavaScript") {
          let buffer = try runtime.eval("expo.modules.ArrayBufferTests.createNative(32)").asArrayBuffer()

          expect(buffer.byteLength) == 32
        }

        it("reads and writes through JavaScript") {
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

          expect(try result[0]?.asInt()) == 42
          expect(try result[1]?.asInt()) == 84
          expect(buffer.byteLength) == 10
        }

        it("maintains data consistency between native and JS") {
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

          expect(buffer.byteLength) == 5
          expect(values.allSatisfy { $0 == 170 }) == true
        }

        it("copies buffer when using NativeArrayBuffer argument") {
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

          expect(originalBuffer.byteLength) == 4
          expect(processedBuffer.byteLength) == 4
          expect(originalValues.allSatisfy { $0 == 42 }) == true  // Original unchanged
          expect(processedValues.allSatisfy { $0 == 99 }) == true // Processed has new pattern
        }
      }

      describe("error handling") {
        it("throws when copying from invalid buffer pointer") {
          expect {
            let emptyBuffer = UnsafeRawBufferPointer(start: nil, count: 0)
            _ = try ArrayBuffer.copy(of: emptyBuffer)
          }.to(throwError())
        }

        it("throws when wrapping invalid buffer pointer") {
          expect {
            let emptyBuffer = UnsafeMutableRawBufferPointer(start: nil, count: 0)
            _ = try ArrayBuffer.wrap(dataWithoutCopy: emptyBuffer, cleanup: {})
          }.to(throwError())
        }

        it("does not throw when copying from empty Data") {
          expect {
            let emptyData = Data()
            _ = try ArrayBuffer.copy(data: emptyData)
          }.toNot(throwError())
        }
      }

      describe("memory management") {
        it("properly manages memory lifecycle") {
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

          expect(cleanupCallCount) > 0
        }

        it("handles zero-size buffers") {
          let buffer = ArrayBuffer.allocate(size: 0)
          expect(buffer.byteLength) == 0
          expect(buffer.rawPointer).toNot(beNil())
        }

        it("allows direct memory access") {
          let size = 1000
          let buffer = ArrayBuffer.allocate(size: size)

          let pattern: UInt8 = 0xAA
          memset(buffer.rawPointer, Int32(pattern), size)

          expect(buffer.data.allSatisfy { $0 == pattern }) == true
        }
      }
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

    Function("fillWithPattern") { (buffer: JavaScriptArrayBuffer, pattern: UInt8) in
      memset(buffer.rawPointer, Int32(pattern), buffer.byteLength)
    }

    Function("processNativeBuffer") { (buffer: NativeArrayBuffer, newPattern: UInt8) -> NativeArrayBuffer in
      memset(buffer.rawPointer, Int32(newPattern), buffer.byteLength)
      return buffer
    }
  }
}
