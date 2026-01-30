//// Copyright 2022-present 650 Industries. All rights reserved.
//
//extension ArrayBuffer {
//  // MARK: - Wrap
//
//  /**
//   Wraps the given raw buffer pointer in an ArrayBuffer without copying data.
//
//   - Parameter data: The raw buffer to wrap
//   - Parameter cleanup: Closure called when the buffer is deallocated
//   - Returns: A new NativeArrayBuffer wrapping the data
//   - Throws: Exception if the buffer has no base address
//   */
//  public static func wrap(
//    dataWithoutCopy data: UnsafeMutableRawBufferPointer,
//    cleanup: @escaping () -> Void
//  ) throws -> NativeArrayBuffer {
//    guard let baseAddress = data.baseAddress else {
//      throw MissingBaseAddressError()
//    }
//    return NativeArrayBuffer(wrapping: baseAddress, count: data.count, cleanup: cleanup)
//  }
//
//  /**
//   Zero-copy wraps the given Data object in an ArrayBuffer.
//
//   - Warning: This bypasses Data's copy-on-write capabilities, effectively allowing
//   mutation of the Data from JavaScript code.
//   - Parameter data: The Data object to wrap
//   - Returns: An ArrayBuffer sharing memory with the Data object
//   */
//  public static func wrap(dataWithoutCopy data: Data) -> ArrayBuffer {
//    let size = data.count
//    let unamanagedData = Unmanaged.passRetained(data as NSData)
//
//    let pointer: UnsafePointer<UInt8> = unamanagedData
//      .takeUnretainedValue()
//      .bytes
//      .assumingMemoryBound(to: UInt8.self)
//    let mutablePtr = UnsafeMutablePointer(mutating: pointer)
//
//    // This should manage the memory of the underlying Data manually
//    return NativeArrayBuffer(wrapping: mutablePtr, count: size, cleanup: { unamanagedData.release() })
//  }
//
//  // MARK: - Allocate
//
//  /**
//   Allocates a new native ArrayBuffer of the given size.
//
//   - Parameter size: The size of the buffer in bytes
//   - Parameter initializeToZero: If true, all bytes are set to 0, otherwise they are uninitialized
//   - Returns: A new NativeArrayBuffer with the allocated memory
//   */
//  public static func allocate(size: Int, initializeToZero: Bool = false) -> NativeArrayBuffer {
//    let data = UnsafeMutablePointer<UInt8>.allocate(capacity: size)
//    if initializeToZero {
//      data.initialize(repeating: 0, count: size)
//    }
//    return NativeArrayBuffer(wrapping: data, count: size, cleanup: { data.deallocate() })
//  }
//
//  // MARK: - Copy
//
//  /**
//   Copies the given raw pointer into a new native ArrayBuffer.
//
//   - Parameter other: The pointer to copy data from
//   - Parameter count: The number of bytes to copy
//   - Returns: A new NativeArrayBuffer containing a copy of the data
//   */
//  public static func copy(
//    of other: UnsafeRawPointer,
//    count: Int
//  ) -> NativeArrayBuffer {
//    let copy = UnsafeMutablePointer<UInt8>.allocate(capacity: count)
//    copy.initialize(from: other.assumingMemoryBound(to: UInt8.self), count: count)
//    return NativeArrayBuffer(wrapping: copy, count: count, cleanup: { copy.deallocate() })
//  }
//
//  public static func copy(of other: UnsafeRawBufferPointer) throws -> NativeArrayBuffer {
//    guard let baseAddress = other.baseAddress else {
//      throw MissingBaseAddressError()
//    }
//    return ArrayBuffer.copy(of: baseAddress, count: other.count)
//  }
//
//  /**
//   Copies the given Data into a new native ArrayBuffer.
//
//   - Parameter data: The Data object to copy
//   - Returns: A new NativeArrayBuffer containing a copy of the data
//   - Throws: Exception if unable to access the Data's bytes
//   */
//  public static func copy(data: Data) throws -> NativeArrayBuffer {
//      // 1. Create new `ArrayBuffer` of same size
//    let size = data.count
//    let arrayBuffer = ArrayBuffer.allocate(size: size)
//      // 2. Copy all bytes from `Data` into our new `ArrayBuffer`
//
//    try data.withUnsafeBytes { rawPointer in
//      guard let baseAddress = rawPointer.baseAddress else {
//        throw MissingBaseAddressError()
//      }
//
//      memcpy(arrayBuffer.rawPointer, baseAddress, size)
//    }
//    return arrayBuffer
//  }
//
//  /**
//   Copies the given ArrayBuffer into a new native ArrayBuffer.
//
//   - Parameter other: The ArrayBuffer to copy
//   - Returns: A new NativeArrayBuffer containing a copy of the data
//   */
//  public static func copy(of other: ArrayBuffer) -> NativeArrayBuffer {
//    ArrayBuffer.copy(of: other.rawPointer, count: other.byteLength)
//  }
//}
//
//// MARK: - Data
//
//extension ArrayBuffer: ContiguousBytes {
//  public func withUnsafeBytes<R>(_ body: (UnsafeRawBufferPointer) throws -> R) rethrows -> R {
//    try body(UnsafeRawBufferPointer(start: self.rawPointer, count: self.byteLength))
//  }
//}
//
///**
// An exception thrown when `baseAddress` of `UnsafeMutableRawBufferPointer` is `nil`.
// */
//public final class MissingBaseAddressError: Exception, @unchecked Sendable {
//  override public var reason: String {
//    "Cannot get baseAddress of given data"
//  }
//}
