// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation

/// An array buffer that manages its own native memory or borrows native-backed memory.
/// Does not require a JavaScript runtime at creation time — the JSI backing buffer
/// is created on demand when the buffer needs to be returned to JavaScript.
///
public final class ArrayBuffer: AnyArrayBuffer, Sendable {
  private let storageBox: SynchronizedArrayBufferStorage

  public var byteLength: Int {
    return storageBox.withStorage { storage in
      storage.byteLength
    }
  }

  /// Whether this buffer's visible byte range is backed by native memory that can be accessed
  /// directly from native code without touching JavaScript heap memory.
  ///
  /// Native-backed ArrayBuffer and TypedArray inputs borrow and retain their native `MutableBuffer`
  /// storage. For TypedArray inputs, this applies to the visible byte range of the view, not
  /// necessarily to the whole backing ArrayBuffer.
  public var isNativeBacked: Bool {
    return storageBox.withStorage { storage in
      storage.isNativeBacked
    }
  }

  internal init(owning data: UnsafeMutableRawPointer, count: Int, cleanup: @escaping () -> Void) {
    self.storageBox = SynchronizedArrayBufferStorage(
      .ownedNative(NativeArrayBufferStorage(pointer: data, byteLength: count, cleanup: cleanup)))
  }

  init(borrowing data: UnsafeMutableRawPointer, count: Int, cleanup: @escaping () -> Void) {
    self.storageBox = SynchronizedArrayBufferStorage(
      .nativeBacked(NativeArrayBufferStorage(pointer: data, byteLength: count, cleanup: cleanup)))
  }

  /// Allocates a new native ArrayBuffer of the given size with zero-initialized memory.
  public convenience init(size: Int, initializeToZero: Bool = true) {
    let data = UnsafeMutablePointer<UInt8>.allocate(capacity: size)
    if initializeToZero {
      data.initialize(repeating: 0, count: size)
    }
    self.init(owning: data, count: size) {
      data.deallocate()
    }
  }

  /// Allocates a new native ArrayBuffer of the given size.
  @available(
    *, deprecated, renamed: "init(size:initializeToZero:)", message: "Use ArrayBuffer(size:initializeToZero:) instead."
  )
  public static func allocate(size: Int, initializeToZero: Bool = true) -> ArrayBuffer {
    return ArrayBuffer(size: size, initializeToZero: initializeToZero)
  }

  private init(storage: ArrayBufferStorage) {
    self.storageBox = SynchronizedArrayBufferStorage(storage)
  }

  // MARK: - AnyArrayBuffer

  /// Creates a native-owned copy of this ArrayBuffer.
  ///
  /// JavaScript-backed storage is permanently materialized before copying, so this instance no
  /// longer observes JavaScript mutations and `isNativeBacked` becomes `true`. If the JavaScript
  /// runtime is unavailable or the backing range is invalid, this nonthrowing API terminates with
  /// a diagnostic instead of substituting an empty buffer.
  public func copy() -> ArrayBuffer {
    let storage = materializedNativeStorageOrFail()
    guard let nativeStorage = storage.nativeStorage else {
      preconditionFailure("ArrayBuffer storage should have been materialized before copying")
    }
    return ArrayBuffer(
      storage: ArrayBufferStorage.makeOwnedNativeStorageCopy(
        of: UnsafeRawPointer(nativeStorage.pointer), count: nativeStorage.byteLength))
  }

  /// Wraps native-backed storage in a `Data` instance without copying.
  ///
  /// If this buffer is JavaScript-backed, this materializes the visible byte range into
  /// native storage first. After materialization, this `ArrayBuffer` instance no longer
  /// observes or mutates the original JavaScript backing storage, and `isNativeBacked`
  /// returns `true`. If materialization fails, this nonthrowing property terminates with a
  /// diagnostic instead of substituting an empty buffer.
  public var data: Data {
    guard let nativeStorage = materializedNativeStorageOrFail().nativeStorage else {
      preconditionFailure("ArrayBuffer storage should have been materialized before Data access")
    }

    let retained = Unmanaged.passRetained(self)
    return Data(
      bytesNoCopy: nativeStorage.pointer,
      count: nativeStorage.byteLength,
      deallocator: .custom({ _, _ in retained.release() }))
  }

  /// Provides read-only access to native-accessible bytes.
  ///
  /// If this buffer is JavaScript-backed, every call creates a fresh full-range transient native
  /// copy that observes the current JavaScript bytes. The copy is not published: this buffer
  /// remains JavaScript-backed and later calls observe later JavaScript mutations. Use
  /// `withJSBytes(_:)` when you need scoped zero-copy access to the current JavaScript backing
  /// storage. If the transient copy cannot be made, this nonthrowing API terminates with a
  /// diagnostic instead of substituting an empty buffer.
  public func withUnsafeBytes<R>(_ body: (UnsafeRawBufferPointer) throws -> R) rethrows -> R {
    switch storageBox.currentStorage() {
    case .ownedNative(let nativeStorage), .nativeBacked(let nativeStorage):
      return try body(UnsafeRawBufferPointer(start: nativeStorage.pointer, count: nativeStorage.byteLength))
    case .javaScriptBacked(let view):
      do {
        let storage = try view.makeOwnedNativeStorageCopy()
        defer { storage.cleanup() }
        guard let nativePointer = storage.nativePointer else {
          preconditionFailure("ArrayBuffer storage copy should be native-backed")
        }
        return try body(UnsafeRawBufferPointer(start: nativePointer, count: storage.byteLength))
      } catch {
        materializationFailure(error)
      }
    }
  }

  /// Provides mutable access to native-accessible bytes.
  ///
  /// If this buffer is JavaScript-backed, this method materializes the visible byte range into
  /// native storage before calling `body`. Mutations then apply to the materialized native
  /// storage, not to the original JavaScript `ArrayBuffer`. Use `withMutableJSBytes(_:)` when
  /// mutations must affect the current JavaScript backing storage. Materialization is permanent:
  /// later access uses the same native storage and `isNativeBacked` becomes `true`. If
  /// materialization fails, this nonthrowing API terminates with a diagnostic instead of
  /// substituting an empty buffer.
  public func withUnsafeMutableBytes<R>(_ body: (UnsafeMutableRawBufferPointer) throws -> R) rethrows -> R {
    let storage = materializedNativeStorageOrFail()
    guard let nativePointer = storage.nativePointer else {
      preconditionFailure("ArrayBuffer storage should have been materialized before mutable access")
    }
    return try body(UnsafeMutableRawBufferPointer(start: nativePointer, count: storage.byteLength))
  }

  // MARK: - Scoped JavaScript access

  /// Provides scoped read-only access to the current backing bytes.
  ///
  /// Native-backed storage is accessed directly. JavaScript-backed storage is accessed on the
  /// JavaScript runtime without materializing a native copy, so reads observe the current
  /// JavaScript `ArrayBuffer` contents. The pointer is valid only while `body` runs; do not retain
  /// it or detach, transfer, or resize the JavaScript backing while it is live. This method throws
  /// `ArrayBufferJSBytesAccessException` if the JavaScript runtime is unavailable or the captured
  /// byte range is invalid.
  @available(*, noasync)
  public func withJSBytes<R: Sendable>(
    _ body: (UnsafeRawBufferPointer) throws -> R
  ) throws -> R {
    switch storageBox.currentStorage() {
    case .ownedNative(let nativeStorage), .nativeBacked(let nativeStorage):
      return try body(UnsafeRawBufferPointer(start: nativeStorage.pointer, count: nativeStorage.byteLength))
    case .javaScriptBacked(let view):
      return try withoutActuallyEscaping(body) { escapingBody in
        return try view.withUnsafeBytes(escapingBody)
      }
    }
  }

  /// Provides scoped read-only access to the current backing bytes.
  ///
  /// Native-backed storage is accessed directly. JavaScript-backed storage is accessed on the
  /// JavaScript runtime without materializing a native copy, so reads observe the current
  /// JavaScript `ArrayBuffer` contents. The pointer is valid only while `body` runs; do not retain
  /// it or detach, transfer, or resize the JavaScript backing while it is live. This method throws
  /// `ArrayBufferJSBytesAccessException` if the JavaScript runtime is unavailable or the captured
  /// byte range is invalid.
  public func withJSBytes<R: Sendable>(
    _ body: @escaping (UnsafeRawBufferPointer) throws -> R
  ) async throws -> R {
    switch storageBox.currentStorage() {
    case .ownedNative(let nativeStorage), .nativeBacked(let nativeStorage):
      return try body(UnsafeRawBufferPointer(start: nativeStorage.pointer, count: nativeStorage.byteLength))
    case .javaScriptBacked(let view):
      return try await view.withUnsafeBytes(body)
    }
  }

  /// Provides scoped mutable access to the current backing bytes.
  ///
  /// Native-backed storage is accessed directly. JavaScript-backed storage is accessed on the
  /// JavaScript runtime without materializing a native copy, so mutations affect the original
  /// JavaScript `ArrayBuffer`. The pointer is valid only while `body` runs; do not retain it or
  /// detach, transfer, or resize the JavaScript backing while it is live. Callers must externally
  /// serialize this access with `copy()`, `data`, `withUnsafeBytes(_:)`, and
  /// `withUnsafeMutableBytes(_:)` on the same buffer. This method throws
  /// `ArrayBufferJSBytesAccessException` if the JavaScript runtime is unavailable or the captured
  /// byte range is invalid.
  @available(*, noasync)
  public func withMutableJSBytes<R: Sendable>(
    _ body: (UnsafeMutableRawBufferPointer) throws -> R
  ) throws -> R {
    switch storageBox.currentStorage() {
    case .ownedNative(let nativeStorage), .nativeBacked(let nativeStorage):
      return try body(UnsafeMutableRawBufferPointer(start: nativeStorage.pointer, count: nativeStorage.byteLength))
    case .javaScriptBacked(let view):
      return try withoutActuallyEscaping(body) { escapingBody in
        return try view.withUnsafeMutableBytes(escapingBody)
      }
    }
  }

  /// Provides scoped mutable access to the current backing bytes.
  ///
  /// Native-backed storage is accessed directly. JavaScript-backed storage is accessed on the
  /// JavaScript runtime without materializing a native copy, so mutations affect the original
  /// JavaScript `ArrayBuffer`. The pointer is valid only while `body` runs; do not retain it or
  /// detach, transfer, or resize the JavaScript backing while it is live. Callers must externally
  /// serialize this access with `copy()`, `data`, `withUnsafeBytes(_:)`, and
  /// `withUnsafeMutableBytes(_:)` on the same buffer. This method throws
  /// `ArrayBufferJSBytesAccessException` if the JavaScript runtime is unavailable or the captured
  /// byte range is invalid.
  public func withMutableJSBytes<R: Sendable>(
    _ body: @escaping (UnsafeMutableRawBufferPointer) throws -> R
  ) async throws -> R {
    switch storageBox.currentStorage() {
    case .ownedNative(let nativeStorage), .nativeBacked(let nativeStorage):
      return try body(UnsafeMutableRawBufferPointer(start: nativeStorage.pointer, count: nativeStorage.byteLength))
    case .javaScriptBacked(let view):
      return try await view.withUnsafeMutableBytes(body)
    }
  }

  // MARK: - JavaScript conversion

  /// Returns a `JavaScriptArrayBuffer` that wraps the native memory managed by this buffer.
  /// The native buffer is retained for the lifetime of the `JavaScriptArrayBuffer`.
  @usableFromInline
  func asJavaScriptArrayBuffer(runtime: JavaScriptRuntime) -> JavaScriptArrayBuffer {
    switch storageBox.currentStorage() {
    case .javaScriptBacked(let view):
      if runtime.isOnJavaScriptThread(),
        let arrayBuffer = JavaScriptActor.assumeIsolated({ view.asJavaScriptArrayBuffer(runtime: runtime) })
      {
        return arrayBuffer
      }
      return copy().asJavaScriptArrayBuffer(runtime: runtime)
    case .ownedNative(let nativeStorage), .nativeBacked(let nativeStorage):
      return runtime.createArrayBuffer(
        data: nativeStorage.pointer.assumingMemoryBound(to: UInt8.self),
        size: nativeStorage.byteLength
      ) { [self] in
        // Retain `self` until the JS engine releases the ArrayBuffer. When this
        // closure is dropped, the buffer deinits and deallocates its memory.
        _ = self
      }
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
      _ = arrayBuffer.withUnsafeMutableBytes { mutablePointer in
        memcpy(mutablePointer.baseAddress!, baseAddress, size)
      }
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
  @JavaScriptActor
  @usableFromInline
  internal static func from(
    value: borrowing JavaScriptValue,
    in runtime: borrowing JavaScriptRuntime
  ) throws
    -> ArrayBuffer
  {
    guard value.isObject() else {
      throw ArrayBufferJavaScriptValueConversionException(value.kind)
    }
    return try ArrayBuffer.from(jsObject: value.getObject(), in: runtime)
  }

  /// Converts a borrowed JavaScript ArrayBuffer or TypedArray without materializing an owning JavaScriptValue.
  @JavaScriptActor
  @usableFromInline
  internal static func from(
    unownedValue: borrowing JavaScriptUnownedValue,
    in runtime: borrowing JavaScriptRuntime
  ) throws -> ArrayBuffer {
    guard unownedValue.isObject() else {
      throw ArrayBufferJavaScriptValueConversionException(unownedValue.copied(in: runtime).kind)
    }
    return try ArrayBuffer.from(jsObject: unownedValue.getObject(in: runtime), in: runtime)
  }

  @JavaScriptActor
  private static func from(
    jsObject: consuming JavaScriptObject,
    in runtime: borrowing JavaScriptRuntime
  ) throws
    -> ArrayBuffer
  {
    if jsObject.isArrayBuffer() {
      let backingValue = jsObject.asValue()
      return ArrayBuffer.from(
        jsArrayBuffer: jsObject.getArrayBuffer(),
        backingValue: backingValue,
        byteOffset: 0,
        in: runtime)
    }
    let jsValue = jsObject.asValue()
    guard jsValue.isTypedArray() else {
      throw ArrayBufferJavaScriptValueConversionException(.object)
    }
    return try ArrayBuffer.from(typedArray: jsValue.getTypedArray(), in: runtime)
  }

  @JavaScriptActor
  private static func from(typedArray: consuming JavaScriptTypedArray, in runtime: borrowing JavaScriptRuntime) throws
    -> ArrayBuffer
  {
    let count = typedArray.byteLength
    let backingBuffer = typedArray.getArrayBuffer()
    if let borrowed = backingBuffer.tryBorrowMutableBuffer() {
      return ArrayBuffer(
        borrowing: UnsafeMutableRawPointer(borrowed.data.advanced(by: typedArray.byteOffset)),
        count: count,
        cleanup: {
          _ = borrowed
        })
    }
    let backingValue = backingBuffer.asValue()
    return ArrayBuffer.from(
      jsArrayBuffer: backingBuffer,
      backingValue: backingValue,
      byteOffset: typedArray.byteOffset,
      in: runtime,
      byteLength: count
    )
  }

  @JavaScriptActor
  private static func from(
    jsArrayBuffer: consuming JavaScriptArrayBuffer,
    backingValue: JavaScriptValue,
    byteOffset: Int,
    in runtime: borrowing JavaScriptRuntime,
    byteLength explicitByteLength: Int? = nil
  ) -> ArrayBuffer {
    let byteLength = explicitByteLength ?? jsArrayBuffer.size
    if let borrowed = jsArrayBuffer.tryBorrowMutableBuffer() {
      return ArrayBuffer(
        borrowing: UnsafeMutableRawPointer(borrowed.data.advanced(by: byteOffset)),
        count: byteLength,
        cleanup: {
          _ = borrowed
        })
    }
    return ArrayBuffer(
      storage: .javaScriptBacked(
        JavaScriptBackedArrayBufferView(
          runtime: copy runtime,
          backingValue: backingValue,
          byteOffset: byteOffset,
          byteLength: byteLength
        )))
  }

  func makeOwnedNativeStorageCopy() throws -> ArrayBufferStorage {
    return try storageBox.currentStorage().makeOwnedNativeStorageCopy()
  }

  private func materializedNativeStorage() throws -> ArrayBufferStorage {
    let storage = storageBox.currentStorage()
    if storage.nativeStorage != nil {
      return storage
    }

    let materializedStorage = try storage.makeOwnedNativeStorageCopy()
    return storageBox.publishMaterializedStorage(materializedStorage)
  }

  private func materializationFailure(_ error: any Error) -> Never {
    preconditionFailure("ArrayBuffer materialization failed: \(error)")
  }

  private func materializedNativeStorageOrFail() -> ArrayBufferStorage {
    do {
      return try materializedNativeStorage()
    } catch {
      materializationFailure(error)
    }
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
    return try ArrayBuffer.from(value: value, in: runtime)
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

public final class ArrayBufferJSBytesAccessException: GenericException<String>, @unchecked Sendable {
  override public var reason: String {
    "ArrayBuffer JS bytes access failed: \(param)"
  }
}
