// Copyright 2025-present 650 Industries. All rights reserved.

internal import jsi
internal import ExpoModulesJSI_Cxx

/**
 A Swift representation of a JavaScript `ArrayBuffer`. Provides access to the
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
   Returns the size of the `ArrayBuffer` storage in bytes.
   This is not affected by overriding the `byteLength` property.
   */
  public var size: Int {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return Int(expo.arrayBufferSize(runtime.pointee, pointee))
  }

  /**
   Returns a pointer to the underlying data of the `ArrayBuffer`.
   */
  public func data() -> UnsafeMutablePointer<UInt8> {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return expo.arrayBufferData(runtime.pointee, pointee)
  }

  // MARK: - Providing JavaScriptObject API

  public func getProperty(_ name: String) -> JavaScriptValue {
    guard let runtime else {
      FatalError.runtimeLost()
    }
    return JavaScriptValue(runtime, pointee.getProperty(runtime.pointee, name))
  }
}
