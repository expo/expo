// Copyright 2025-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx
internal import jsi

/// A Swift representation of a JavaScript array buffer. Provides access to the
/// underlying raw data pointer and size of the buffer.
public struct JavaScriptArrayBuffer: ~Copyable {
  /// Handle to the runtime the array buffer belongs to.
  internal let runtimeHandle: JavaScriptRuntimeHandle
  internal let pointee: facebook.jsi.ArrayBuffer

  /// The runtime the array buffer belongs to, or `nil` if it has been deallocated. Prefer
  /// ``jsiRuntime`` on hot paths: it costs no reference counting.
  internal var runtime: JavaScriptRuntime? {
    return runtimeHandle.runtime
  }

  /// The engine runtime the array buffer belongs to, or `nil` if the runtime has been deallocated.
  internal var jsiRuntime: facebook.jsi.IRuntime? {
    return runtimeHandle.pointee
  }

  internal init(_ runtime: borrowing JavaScriptRuntime, _ arrayBuffer: consuming facebook.jsi.ArrayBuffer) {
    self.runtimeHandle = runtime.handle
    self.pointee = arrayBuffer
  }

  /// Creates an array buffer from an existing JSI array buffer, which belongs to the runtime behind
  /// `runtimeHandle`.
  internal init(_ runtimeHandle: JavaScriptRuntimeHandle, _ arrayBuffer: consuming facebook.jsi.ArrayBuffer) {
    self.runtimeHandle = runtimeHandle
    self.pointee = arrayBuffer
  }

  /// Returns the size of the array buffer storage in bytes.
  /// This is not affected by overriding the `byteLength` property.
  public var size: Int {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return Int(expo.arrayBufferSize(jsiRuntime, pointee))
  }

  /// Alias for `size` that matches JavaScript's `ArrayBuffer.byteLength` property.
  public var byteLength: Int { size }

  /// Returns a pointer to the underlying data of the array buffer.
  public func data() -> UnsafeMutablePointer<UInt8> {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return expo.arrayBufferData(jsiRuntime, pointee)
  }

  /// Creates a new array buffer with a copy of this buffer's data.
  public func copy() -> JavaScriptArrayBuffer {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let byteCount = size
    let newBuffer = runtime.createArrayBuffer(size: byteCount, initializeToZero: false)
    memcpy(newBuffer.data(), data(), byteCount)
    return newBuffer
  }

  // MARK: - Zero-copy borrowing

  /// Attempts to obtain the underlying native MutableBuffer without copying.
  /// Returns `nil` if the buffer is JS-heap-allocated (no MutableBuffer available).
  /// The returned buffer keeps the underlying memory alive until it is deallocated.
  public func tryBorrowMutableBuffer() -> JavaScriptMutableBuffer? {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    let borrowed = expo.tryBorrowMutableBuffer(jsiRuntime, pointee)
    guard let data = borrowed.data, let retainer = borrowed.retainer else {
      return nil
    }
    return JavaScriptMutableBuffer(data: data, size: Int(borrowed.size), retainer: retainer)
  }

  // MARK: - Conversions

  /// Returns this array buffer as a `JavaScriptValue`.
  public func asValue() -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtimeHandle, expo.valueFromArrayBuffer(jsiRuntime, pointee))
  }

  // MARK: - Providing JavaScriptObject API

  public func getProperty(_ name: String) -> JavaScriptValue {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtimeHandle, pointee.getProperty(jsiRuntime, name))
  }
}
