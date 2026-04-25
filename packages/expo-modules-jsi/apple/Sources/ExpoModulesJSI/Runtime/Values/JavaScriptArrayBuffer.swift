// Copyright 2025-present 650 Industries. All rights reserved.

internal import jsi
internal import ExpoModulesJSI_Cxx

/**
 A Swift representation of a JavaScript array buffer. Provides access to the
 underlying raw data pointer and size of the buffer.
 */
public struct JavaScriptArrayBuffer: ~Copyable {
  internal weak let runtime: JavaScriptRuntime?
  internal let pointee: facebook.jsi.ArrayBuffer

  internal init(_ runtime: JavaScriptRuntime, _ arrayBuffer: consuming facebook.jsi.ArrayBuffer) {
    self.runtime = runtime
    self.pointee = arrayBuffer
  }

  /**
   Returns the size of the array buffer storage in bytes.
   This is not affected by overriding the `byteLength` property.
   */
  public var size: Int {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return Int(expo.arrayBufferSize(runtime.pointee, pointee))
  }

  /**
   Alias for `size` that matches JavaScript's `ArrayBuffer.byteLength` property.
   */
  public var byteLength: Int { size }

  /**
   Returns a pointer to the underlying data of the array buffer.
   */
  public func data() -> UnsafeMutablePointer<UInt8> {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return expo.arrayBufferData(runtime.pointee, pointee)
  }

  /**
   Creates a new array buffer with a copy of this buffer's data.
   */
  public func copy() -> JavaScriptArrayBuffer {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    let byteCount = size
    let newBuffer = runtime.createArrayBuffer(size: byteCount)
    memcpy(newBuffer.data(), data(), byteCount)
    return newBuffer
  }

  // MARK: - Conversions

  /**
   Returns this array buffer as a `JavaScriptValue`.
   */
  public func asValue() -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtime, expo.valueFromArrayBuffer(runtime.pointee, pointee))
  }

  // MARK: - Providing JavaScriptObject API

  public func getProperty(_ name: String) -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtime, pointee.getProperty(runtime.pointee, name))
  }
}
