// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 Represents a fixed-length raw binary data buffer backed by a `JavaScriptArrayBuffer`.
 Provides access to the underlying memory owned by the JavaScript runtime.
 */
public final class ArrayBuffer: AnyArrayBuffer, @unchecked Sendable {
  /**
   The underlying JSI array buffer that manages the memory and JS runtime reference.
   */
  internal let backingBuffer: JavaScriptArrayBuffer

  /**
   Initializes the array buffer with the given JSI array buffer.
   */
  internal init(_ backingBuffer: consuming JavaScriptArrayBuffer) {
    self.backingBuffer = backingBuffer
  }

  /**
   The length of the ArrayBuffer in bytes.
   Fixed at construction time and thus read only.
   */
  public lazy var byteLength: Int = backingBuffer.size

  /**
   The unsafe mutable raw pointer to the start of the array buffer.
   */
  private lazy var rawPointer: UnsafeMutableRawPointer = UnsafeMutableRawPointer(backingBuffer.data())

  public func copy() -> NativeArrayBuffer {
    return NativeArrayBuffer.copy(of: rawPointer, count: byteLength)
  }

  public var data: Data {
    let retained = Unmanaged.passRetained(self)
    return Data(
      bytesNoCopy: rawPointer,
      count: byteLength,
      deallocator: .custom({ _, _ in retained.release() }))
  }

  public func withUnsafeBytes<R>(_ body: (UnsafeRawBufferPointer) throws -> R) rethrows -> R {
    return try body(UnsafeRawBufferPointer(start: rawPointer, count: byteLength))
  }
}
