// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/// An array buffer that manages its own native memory or borrows native-backed memory.
/// Does not require a JavaScript runtime at creation time — the JSI backing buffer
/// is created on demand when the buffer needs to be returned to JavaScript.
///
public final class ArrayBuffer: AnyArrayBuffer, Sendable {
  private let storage: ArrayBufferStorage

  private var rawPointer: UnsafeMutableRawPointer {
    return storage.rawPointer
  }

  public var byteLength: Int {
    return storage.byteLength
  }

  /// Whether this buffer's visible byte range is backed by native memory that can be accessed
  /// directly from native code without touching JavaScript heap memory.
  ///
  /// JS-heap ArrayBuffer and TypedArray inputs are copied into native memory. Native-backed
  /// ArrayBuffer and TypedArray inputs borrow and retain their native `MutableBuffer` storage.
  public var isNativeBacked: Bool {
    return storage.isNativeBacked
  }

  internal init(owning data: UnsafeMutableRawPointer, count: Int, cleanup: @escaping () -> Void) {
    self.storage = .ownedNative(
      NativeArrayBufferStorage(pointer: data, byteLength: count, cleanup: cleanup))
  }

  init(borrowing data: UnsafeMutableRawPointer, count: Int, cleanup: @escaping () -> Void) {
    self.storage = .nativeBacked(
      NativeArrayBufferStorage(pointer: data, byteLength: count, cleanup: cleanup))
  }

  /// Allocates a new native ArrayBuffer of the given size with zero-initialized memory.
  convenience init(size: Int, initializeToZero: Bool = true) {
    let data = UnsafeMutablePointer<UInt8>.allocate(capacity: size)
    if initializeToZero {
      data.initialize(repeating: 0, count: size)
    }
    self.init(owning: data, count: size) {
      data.deallocate()
    }
  }

  deinit {
    storage.cleanup()
  }

  // MARK: - AnyArrayBuffer

  /// Creates a native-owned copy of this ArrayBuffer.
  public func copy() -> ArrayBuffer {
    return ArrayBuffer.copy(of: rawPointer, count: byteLength)
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

  public func withUnsafeMutableBytes<R>(_ body: (UnsafeMutableRawBufferPointer) throws -> R) rethrows -> R {
    return try body(UnsafeMutableRawBufferPointer(start: rawPointer, count: byteLength))
  }

  // MARK: - JavaScript conversion

  /// Returns a `JavaScriptArrayBuffer` that wraps the native memory managed by this buffer.
  /// The native buffer is retained for the lifetime of the `JavaScriptArrayBuffer`.
  @usableFromInline
  func asJavaScriptArrayBuffer(runtime: JavaScriptRuntime) -> JavaScriptArrayBuffer {
    return runtime.createArrayBuffer(
      data: rawPointer.assumingMemoryBound(to: UInt8.self),
      size: byteLength
    ) { [self] in
      // Retain `self` until the JS engine releases the ArrayBuffer. When this
      // closure is dropped, the buffer deinits and deallocates its memory.
      _ = self
    }
  }

  // MARK: - Copy

  /// Copies the given raw pointer into a new native ArrayBuffer.
  public static func copy(of other: UnsafeRawPointer, count: Int) -> ArrayBuffer {
    if count == 0 {
      return ArrayBuffer(size: 0, initializeToZero: false)
    }
    let copy = UnsafeMutablePointer<UInt8>.allocate(capacity: count)
    copy.initialize(from: other.assumingMemoryBound(to: UInt8.self), count: count)

    return ArrayBuffer(owning: copy, count: count) {
      copy.deallocate()
    }
  }

  /// Copies the given Data into a new native ArrayBuffer.
  public static func copy(data: Data) throws -> ArrayBuffer {
    let size = data.count
    if size == 0 {
      return ArrayBuffer(size: 0, initializeToZero: false)
    }
    let arrayBuffer = ArrayBuffer(size: size, initializeToZero: false)

    try data.withUnsafeBytes { rawPointer in
      guard let baseAddress = rawPointer.baseAddress else {
        throw MissingBaseAddressError()
      }
      memcpy(arrayBuffer.rawPointer, baseAddress, size)
    }
    return arrayBuffer
  }

  // MARK: - Wrap

  /// Wraps the given raw buffer pointer in an ArrayBuffer without copying data.
  public static func wrap(
    dataWithoutCopy data: UnsafeMutableRawBufferPointer,
    cleanup: @escaping () -> Void
  ) throws -> ArrayBuffer {
    guard let baseAddress = data.baseAddress else {
      throw MissingBaseAddressError()
    }
    return ArrayBuffer(owning: baseAddress, count: data.count, cleanup: cleanup)
  }

  /// Zero-copy wraps the given Data object in an ArrayBuffer. The Data's backing store
  /// is retained for the lifetime of the returned buffer.
  ///
  /// - Warning: This bypasses Data's copy-on-write capabilities, effectively allowing
  ///   mutation of the Data from JavaScript code.
  public static func wrap(dataWithoutCopy data: Data) -> ArrayBuffer {
    let retained = Unmanaged.passRetained(data as NSData)
    let pointer = UnsafeMutableRawPointer(mutating: retained.takeUnretainedValue().bytes)
    return ArrayBuffer(owning: pointer, count: data.count) {
      retained.release()
    }
  }

  // MARK: - JavaScript conversion

  /// Converts a JavaScript ArrayBuffer or TypedArray to Expo's safe native ArrayBuffer representation.
  @usableFromInline
  internal static func from(value: borrowing JavaScriptValue) throws -> ArrayBuffer {
    guard value.isObject() else {
      throw ArrayBufferJavaScriptValueConversionException(value.kind)
    }
    return try ArrayBuffer.from(jsObject: value.getObject())
  }

  /// Converts a borrowed JavaScript ArrayBuffer or TypedArray without materializing an owning JavaScriptValue.
  @usableFromInline
  internal static func from(
    unownedValue: borrowing JavaScriptUnownedValue,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> ArrayBuffer {
    guard unownedValue.isObject() else {
      throw ArrayBufferJavaScriptValueConversionException(unownedValue.copied(in: runtime).kind)
    }
    return try ArrayBuffer.from(jsObject: unownedValue.getObject(in: runtime))
  }

  private static func from(jsObject: consuming JavaScriptObject) throws -> ArrayBuffer {
    if jsObject.isArrayBuffer() {
      return ArrayBuffer.from(jsArrayBuffer: jsObject.getArrayBuffer())
    }
    let jsValue = jsObject.asValue()
    guard jsValue.isTypedArray() else {
      throw ArrayBufferJavaScriptValueConversionException(.object)
    }
    return try ArrayBuffer.from(typedArray: jsValue.getTypedArray())
  }

  private static func from(typedArray: consuming JavaScriptTypedArray) throws -> ArrayBuffer {
    let count = typedArray.byteLength

    if count == 0 {
      return ArrayBuffer(size: 0)
    }
    return typedArray.withUnsafeBytes { bytes in
      let backingBuffer = typedArray.getArrayBuffer()
      if let borrowed = backingBuffer.tryBorrowMutableBuffer() {
        return ArrayBuffer(
          borrowing: UnsafeMutableRawPointer(borrowed.data.advanced(by: typedArray.byteOffset)),
          count: count,
          cleanup: {
            _ = borrowed
          })
      }
      return ArrayBuffer.copy(of: bytes.baseAddress!, count: count)
    }
  }

  private static func from(jsArrayBuffer: consuming JavaScriptArrayBuffer) -> ArrayBuffer {
    if jsArrayBuffer.size == 0 {
      return ArrayBuffer(size: 0)
    }
    if let borrowed = jsArrayBuffer.tryBorrowMutableBuffer() {
      return ArrayBuffer(
        borrowing: UnsafeMutableRawPointer(borrowed.data),
        count: borrowed.size,
        cleanup: {
          _ = borrowed
        })
    }
    return ArrayBuffer.copy(of: UnsafeRawPointer(jsArrayBuffer.data()), count: jsArrayBuffer.size)
  }
}

extension ArrayBuffer: JavaScriptDecodable, JavaScriptEncodable {
  // MARK: - JavaScriptDecodable
  @JavaScriptActor
  @inlinable
  public static func decode(
    _ value: borrowing JavaScriptValue,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> ArrayBuffer {
    return try ArrayBuffer.from(value: value)
  }

  @JavaScriptActor
  @inlinable
  public static func decode(
    _ value: borrowing JavaScriptUnownedValue,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> ArrayBuffer {
    return try ArrayBuffer.from(unownedValue: value, in: runtime)
  }

  // MARK: - JavaScriptEncodable
  @JavaScriptActor
  @inlinable
  public static func encode(
    _ value: ArrayBuffer,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> JavaScriptValue {
    return value.asJavaScriptArrayBuffer(runtime: copy runtime).asValue()
  }
}

internal final class ArrayBufferJavaScriptValueConversionException:
  GenericException<JavaScriptValue.Kind>, @unchecked Sendable
{
  override var reason: String {
    "Given argument is not an ArrayBuffer or TypedArray, got \(param.rawValue)"
  }
}

/// Describes the native storage mode used by `ArrayBuffer`.
///
/// Both cases are native-backed and safe to access from native code. `.ownedNative` owns
/// allocated memory, while `.nativeBacked` retains a borrowed native JSI `MutableBuffer`.
private enum ArrayBufferStorage: Sendable {
  case ownedNative(NativeArrayBufferStorage)
  case nativeBacked(NativeArrayBufferStorage)

  var rawPointer: UnsafeMutableRawPointer {
    switch self {
    case .ownedNative(let storage), .nativeBacked(let storage):
      return storage.pointer
    }
  }

  var byteLength: Int {
    switch self {
    case .ownedNative(let storage), .nativeBacked(let storage):
      return storage.byteLength
    }
  }

  var isNativeBacked: Bool {
    switch self {
    case .ownedNative, .nativeBacked:
      return true
    }
  }

  func cleanup() {
    switch self {
    case .ownedNative(let storage), .nativeBacked(let storage):
      storage.cleanup()
    }
  }
}

/// Stores a native-memory byte range and the cleanup closure that owns or retains it.
///
/// This is `@unchecked Sendable` because Swift cannot prove raw pointer safety, but
/// `ArrayBufferStorage` only exposes memory that is native-backed and lifetime-retained.
private struct NativeArrayBufferStorage: @unchecked Sendable {
  let pointer: UnsafeMutableRawPointer
  let byteLength: Int
  let cleanup: () -> Void
}
