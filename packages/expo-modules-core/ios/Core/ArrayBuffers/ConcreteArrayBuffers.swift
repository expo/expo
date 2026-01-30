//// Copyright 2022-present 650 Industries. All rights reserved.
//
///**
// Generic ArrayBuffer with an associated raw buffer type.
// */
//public class GenericArrayBuffer<BufferType: RawArrayBuffer>: ArrayBuffer {
//  internal convenience init(_ backingBuffer: BufferType) {
//    self.init(backingBuffer as RawArrayBuffer)
//  }
//}
//
///**
// Native ArrayBuffer implementation that owns its memory and manages deallocation.
// */
//public final class NativeArrayBuffer: GenericArrayBuffer<RawNativeArrayBuffer> {
//  convenience init(wrapping data: UnsafeMutableRawPointer, count: Int, cleanup: @escaping () -> Void) {
//    let backingBuffer = RawNativeArrayBuffer(data: data, size: count, cleanup: cleanup)
//    self.init(backingBuffer)
//  }
//}
//
///**
// JavaScript ArrayBuffer implementation that wraps a JavaScript ArrayBuffer object.
// This provides a native Swift interface to ArrayBuffers created in JavaScript.
// */
//public final class JavaScriptArrayBuffer: GenericArrayBuffer<RawJavaScriptArrayBuffer> {}
