//// Copyright 2022-present 650 Industries. All rights reserved.
//
///**
// The base class for any type of array buffer.
// ArrayBuffer objects are used to represent a generic, fixed-length raw binary data buffer.
// */
//public class ArrayBuffer: AnyArrayBuffer {
//  let backingBuffer: RawArrayBuffer
//
//  /**
//   Initializes the array buffer with the given raw array buffer.
//
//   - Parameter RawArrayBuffer: The underlying raw buffer implementation
//   */
//  internal required init(_ RawArrayBuffer: RawArrayBuffer) {
//    self.backingBuffer = RawArrayBuffer
//  }
//
//  /**
//   The length of the ArrayBuffer in bytes.
//   Fixed at construction time and thus read only.
//   */
//  public lazy var byteLength: Int = backingBuffer.getSize()
//
//  /**
//   The unsafe mutable raw pointer to the start of the array buffer.
//   */
//  public lazy var rawPointer: UnsafeMutableRawPointer = backingBuffer.getUnsafeMutableRawPointer()
//
//  /**
//   Creates a copy of this ArrayBuffer with its own allocated memory.
//
//   - Returns: A new NativeArrayBuffer containing a copy of this buffer's data
//   */
//  public func copy() -> NativeArrayBuffer {
//    ArrayBuffer.copy(of: self)
//  }
//
//  /**
//   Wraps this ArrayBuffer in a Data instance without performing a copy.
//   The returned Data object shares the same memory as this ArrayBuffer.
//
//   - Note: Swift `Data` is a copy-on-write type. Mutating the data
//   doesn't guarantee to modify the array buffer's underlying memory.
//   */
//  public var data: Data {
//    // Get a strong reference to prevent deallocation while Data object exists
//    let sharedPointer = backingBuffer.memoryStrongRef()
//
//    return Data(
//      bytesNoCopy: rawPointer,
//      count: byteLength,
//      deallocator: .custom({ _, _ in sharedPointer?.reset() }))
//  }
//
//  /**
//   Creates an NSMutableData object that shares the same memory as this ArrayBuffer.
//
//   - Returns: An NSMutableData object backed by this ArrayBuffer's memory
//   */
//  public func mutableData() -> NSMutableData {
//    // Get a strong reference to prevent deallocation while NSMutableData object exists
//    let sharedPointer = backingBuffer.memoryStrongRef()
//
//    return NSMutableData(
//      bytesNoCopy: rawPointer,
//      length: byteLength,
//      deallocator: { _, _ in sharedPointer?.reset() }
//    )
//  }
//}
