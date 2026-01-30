//// Copyright 2022-present 650 Industries. All rights reserved.
//
///**
// A protocol for all array buffer types.
// Array buffers represent a fixed-length raw binary data buffer.
// */
//internal protocol AnyArrayBuffer: AnyArgument {
//  /**
//   Initializes an array buffer from the given underlying representation.
//   */
//   init(_ backingBuffer: RawArrayBuffer)
//}
//
//// Extend the protocol to provide custom dynamic type
//extension AnyArrayBuffer {
//  public static func getDynamicType() -> AnyDynamicType {
//    return DynamicArrayBufferType(innerType: Self.self)
//  }
//}
