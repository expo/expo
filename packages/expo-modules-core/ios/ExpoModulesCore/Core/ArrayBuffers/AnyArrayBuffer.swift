// Copyright 2022-present 650 Industries. All rights reserved.

/**
 A protocol for all array buffer types.
 Array buffers represent a fixed-length raw binary data buffer.
 */
public protocol AnyArrayBuffer: AnyArgument, ContiguousBytes {
  /**
   The length of the buffer in bytes.
   */
  var byteLength: Int { get }

  /**
   Creates a copy of this buffer with its own allocated memory.
   */
  func copy() -> NativeArrayBuffer

  /**
   Wraps this buffer in a `Data` instance without performing a copy.
   */
  var data: Data { get }
}

extension AnyArrayBuffer {
  public static func getDynamicType() -> AnyDynamicType {
    return DynamicArrayBufferType(innerType: Self.self)
  }
}
