// Copyright 2025-present 650 Industries. All rights reserved.

internal import jsi
internal import ExpoModulesJSI_Cxx

public struct JavaScriptTypedArray: ~Copyable {
  internal weak var runtime: JavaScriptRuntime?
  internal let pointee: expo.TypedArray

  public let kind: Kind

  init(_ runtime: JavaScriptRuntime, _ typedArray: consuming expo.TypedArray) {
    self.runtime = runtime
    self.pointee = typedArray
    self.kind = Kind(rawValue: Int(pointee.getKind(runtime.pointee).rawValue))!
    self.byteLength = Int(pointee.getProperty(runtime.pointee, "byteLength").getNumber())
    self.byteOffset = Int(pointee.getProperty(runtime.pointee, "byteOffset").getNumber())
    self.length = Int(pointee.getProperty(runtime.pointee, "length").getNumber())
  }

  public func getUnsafeMutableRawPointer() -> UnsafeMutableRawPointer {
    guard let runtime else {
      JS.runtimeLostFatalError()
    }
    return pointee.__getRawPointerUnsafe(runtime.pointee)
  }

  // We need to redefine the C++ enum (see TypedArray.h) to expose it to Swift
  // without leaking the C++ type into the public API. Please keep them in-sync!
  public enum Kind: Int {
    case Int8Array = 1
    case Int16Array = 2
    case Int32Array = 3
    case Uint8Array = 4
    case Uint8ClampedArray = 5
    case Uint16Array = 6
    case Uint32Array = 7
    case Float32Array = 8
    case Float64Array = 9
    case BigInt64Array = 10
    case BigUint64Array = 11
  }

  // MARK: - Expose JS properties

  /**
   The length in bytes from the start of the underlying ArrayBuffer.
   Fixed at construction time and thus read-only.
   */
  public let byteLength: Int

  /**
   The offset in bytes from the start of the underlying ArrayBuffer.
   Fixed at construction time and thus read-only.
   */
  public let byteOffset: Int

  /**
   Returns the number of elements held in the typed array.
   Fixed at construction time and thus read only.
   */
  public let length: Int

  // MARK: - Providing JavaScriptObject API

  public func getProperty(_ name: String) -> JavaScriptValue {
    guard let runtime else {
      JS.runtimeLostFatalError()
    }
    return JavaScriptValue(runtime, pointee.getProperty(runtime.pointee, name))
  }
}
