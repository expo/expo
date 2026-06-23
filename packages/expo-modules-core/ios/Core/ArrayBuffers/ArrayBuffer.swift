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

  convenience init(wrapping data: UnsafeMutableRawPointer, count: Int, cleanup: @escaping () -> Void) {
    self.init(owning: data, count: count, cleanup: cleanup)
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
  @available(*, deprecated, renamed: "init(size:initializeToZero:)", message: "Use ArrayBuffer(size:initializeToZero:) instead.")
  public static func allocate(size: Int, initializeToZero: Bool = true) -> ArrayBuffer {
    return ArrayBuffer(size: size, initializeToZero: initializeToZero)
  }

  private init(storage: ArrayBufferStorage) {
    self.storageBox = SynchronizedArrayBufferStorage(storage)
  }

  // MARK: - AnyArrayBuffer

  /// Creates a native-owned copy of this ArrayBuffer.
  public func copy() -> ArrayBuffer {
    return ArrayBuffer(storage: makeOwnedNativeStorageCopy())
  }

  public var data: Data {
    switch storageBox.withStorage({ $0 }) {
    case .ownedNative(let nativeStorage), .nativeBacked(let nativeStorage):
      let retained = Unmanaged.passRetained(self)
      return Data(
        bytesNoCopy: nativeStorage.pointer,
        count: nativeStorage.byteLength,
        deallocator: .custom({ _, _ in retained.release() }))
    case .javaScriptBacked(let view):
      return Self.copyData(from: view)
    }
  }

  /// Provides read-only access to native-accessible bytes.
  ///
  /// If this buffer is JavaScript-backed, this method reads from a native copy instead of
  /// exposing JavaScript heap memory directly. Use `withJSBytes(_:)` when you need
  /// scoped zero-copy access to the current JavaScript backing storage.
  public func withUnsafeBytes<R>(_ body: (UnsafeRawBufferPointer) throws -> R) rethrows -> R {
    switch storageBox.withStorage({ $0 }) {
    case .ownedNative(let nativeStorage), .nativeBacked(let nativeStorage):
      return try body(UnsafeRawBufferPointer(start: nativeStorage.pointer, count: nativeStorage.byteLength))
    case .javaScriptBacked(let view):
      let storage = Self.makeOwnedNativeStorageCopy(from: view)
      defer { storage.cleanup() }
      guard let nativePointer = storage.nativePointer else {
        preconditionFailure("ArrayBuffer storage copy should be native-backed")
      }
      return try body(UnsafeRawBufferPointer(start: nativePointer, count: storage.byteLength))
    }
  }

  /// Provides mutable access to native-accessible bytes.
  ///
  /// If this buffer is JavaScript-backed, this method materializes the visible byte range into
  /// native storage before calling `body`. Mutations then apply to the materialized native
  /// storage, not to the original JavaScript `ArrayBuffer`. Use `withMutableJSBytes(_:)` when
  /// mutations must affect the current JavaScript backing storage.
  public func withUnsafeMutableBytes<R>(_ body: (UnsafeMutableRawBufferPointer) throws -> R) rethrows -> R {
    return try storageBox.withMutableStorage { storage in
      if storage.nativePointer == nil {
        storage = Self.makeOwnedNativeStorageCopy(from: storage)
      }
      guard let nativePointer = storage.nativePointer else {
        preconditionFailure("ArrayBuffer storage should have been materialized before mutable access")
      }
      return try body(UnsafeMutableRawBufferPointer(start: nativePointer, count: storage.byteLength))
    }
  }

  // MARK: - Scoped JavaScript access

  /// Provides scoped read-only access to the current backing bytes.
  ///
  /// Native-backed storage is accessed directly. JavaScript-backed storage is accessed on the
  /// JavaScript runtime without materializing a native copy, so reads observe the current
  /// JavaScript `ArrayBuffer` contents.
  @available(*, noasync)
  public func withJSBytes<R: Sendable>(
    _ body: (UnsafeRawBufferPointer) throws -> R
  ) throws -> R {
    switch storageBox.withStorage({ $0 }) {
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
  /// JavaScript `ArrayBuffer` contents.
  public func withJSBytes<R: Sendable>(
    _ body: @escaping (UnsafeRawBufferPointer) throws -> R
  ) async throws -> R {
    switch storageBox.withStorage({ $0 }) {
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
  /// JavaScript `ArrayBuffer`.
  @available(*, noasync)
  public func withMutableJSBytes<R: Sendable>(
    _ body: (UnsafeMutableRawBufferPointer) throws -> R
  ) throws -> R {
    switch storageBox.withStorage({ $0 }) {
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
  /// JavaScript `ArrayBuffer`.
  public func withMutableJSBytes<R: Sendable>(
    _ body: @escaping (UnsafeMutableRawBufferPointer) throws -> R
  ) async throws -> R {
    switch storageBox.withStorage({ $0 }) {
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
    switch storageBox.withStorage({ $0 }) {
    case .javaScriptBacked(let view):
      if let arrayBuffer = JavaScriptActor.assumeIsolated({ view.asJavaScriptArrayBuffer(runtime: runtime) }) {
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

    return ArrayBuffer(wrapping: copy, count: count) {
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
    return ArrayBuffer(wrapping: baseAddress, count: data.count, cleanup: cleanup)
  }

  /// Zero-copy wraps the given Data object in an ArrayBuffer. The Data's backing store
  /// is retained for the lifetime of the returned buffer.
  ///
  /// - Warning: This bypasses Data's copy-on-write capabilities, effectively allowing
  ///   mutation of the Data from JavaScript code.
  public static func wrap(dataWithoutCopy data: Data) -> ArrayBuffer {
    let retained = Unmanaged.passRetained(data as NSData)
    let pointer = UnsafeMutableRawPointer(mutating: retained.takeUnretainedValue().bytes)
    return ArrayBuffer(wrapping: pointer, count: data.count) {
      retained.release()
    }
  }

  // MARK: - JavaScript conversion

  /// Converts a JavaScript ArrayBuffer or TypedArray to Expo's safe native ArrayBuffer representation.
  @usableFromInline
  internal static func from(value: borrowing JavaScriptValue, in runtime: borrowing JavaScriptRuntime) throws
    -> ArrayBuffer
  {
    guard value.isObject() else {
      throw ArrayBufferJavaScriptValueConversionException(value.kind)
    }
    return try ArrayBuffer.from(jsObject: value.getObject(), in: runtime)
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
    return try ArrayBuffer.from(jsObject: unownedValue.getObject(in: runtime), in: runtime)
  }

  private static func from(jsObject: consuming JavaScriptObject, in runtime: borrowing JavaScriptRuntime) throws
    -> ArrayBuffer
  {
    if jsObject.isArrayBuffer() {
      let backingValue = jsObject.asValue()
      return ArrayBuffer.from(
        jsArrayBuffer: jsObject.getArrayBuffer(), backingValue: backingValue, byteOffset: 0, in: runtime)
    }
    let jsValue = jsObject.asValue()
    guard jsValue.isTypedArray() else {
      throw ArrayBufferJavaScriptValueConversionException(.object)
    }
    return try ArrayBuffer.from(typedArray: jsValue.getTypedArray(), in: runtime)
  }

  private static func from(typedArray: consuming JavaScriptTypedArray, in runtime: borrowing JavaScriptRuntime) throws
    -> ArrayBuffer
  {
    let count = typedArray.byteLength

    if count == 0 {
      return ArrayBuffer(size: 0)
    }
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

  private static func from(
    jsArrayBuffer: consuming JavaScriptArrayBuffer,
    backingValue: JavaScriptValue,
    byteOffset: Int,
    in runtime: borrowing JavaScriptRuntime,
    byteLength explicitByteLength: Int? = nil
  ) -> ArrayBuffer {
    let byteLength = explicitByteLength ?? jsArrayBuffer.size
    if jsArrayBuffer.size == 0 {
      return ArrayBuffer(size: 0)
    }
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

  private func makeOwnedNativeStorageCopy() -> ArrayBufferStorage {
    return Self.makeOwnedNativeStorageCopy(from: storageBox.withStorage({ $0 }))
  }

  private static func makeOwnedNativeStorageCopy(from storage: ArrayBufferStorage) -> ArrayBufferStorage {
    switch storage {
    case .ownedNative(let nativeStorage), .nativeBacked(let nativeStorage):
      return Self.makeOwnedNativeStorageCopy(
        of: UnsafeRawPointer(nativeStorage.pointer), count: nativeStorage.byteLength)
    case .javaScriptBacked(let view):
      return Self.makeOwnedNativeStorageCopy(from: view)
    }
  }

  private static func copyData(from view: JavaScriptBackedArrayBufferView) -> Data {
    do {
      return try view.withUnsafeBytes { bytes in
        guard let baseAddress = bytes.baseAddress else {
          return Data()
        }
        return Data(bytes: baseAddress, count: bytes.count)
      }
    } catch {
      preconditionFailure("Failed to copy JavaScript-backed ArrayBuffer data: \(error)")
    }
  }

  private static func makeOwnedNativeStorageCopy(from view: JavaScriptBackedArrayBufferView) -> ArrayBufferStorage {
    do {
      return try view.withUnsafeBytes { bytes in
        guard let baseAddress = bytes.baseAddress else {
          return makeOwnedNativeStorageCopy(of: UnsafeRawPointer(bitPattern: 1)!, count: 0)
        }
        return makeOwnedNativeStorageCopy(of: baseAddress, count: bytes.count)
      }
    } catch {
      preconditionFailure("Failed to materialize JavaScript-backed ArrayBuffer storage: \(error)")
    }
  }

  private static func makeOwnedNativeStorageCopy(of pointer: UnsafeRawPointer, count: Int) -> ArrayBufferStorage {
    if count == 0 {
      let data = UnsafeMutablePointer<UInt8>.allocate(capacity: 0)
      return .ownedNative(
        NativeArrayBufferStorage(pointer: data, byteLength: 0) {
          data.deallocate()
        })
    }
    let copy = UnsafeMutablePointer<UInt8>.allocate(capacity: count)
    copy.initialize(from: pointer.assumingMemoryBound(to: UInt8.self), count: count)
    return .ownedNative(
      NativeArrayBufferStorage(pointer: copy, byteLength: count) {
        copy.deallocate()
      })
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
    param
  }
}

/// Stores a native-memory byte range and the cleanup closure that owns or retains it.
///
/// This is `@unchecked Sendable` because Swift cannot prove raw pointer safety, but
/// `ArrayBufferStorage` only exposes this storage after native memory has been retained.
private struct NativeArrayBufferStorage: @unchecked Sendable {
  let pointer: UnsafeMutableRawPointer
  let byteLength: Int
  let cleanup: () -> Void
}

/// Describes the storage mode used by `ArrayBuffer`.
///
/// `.ownedNative` owns allocated native memory, `.nativeBacked` retains a borrowed native
/// JSI `MutableBuffer`, and `.javaScriptBacked` is scoped to JavaScript runtime access.
private enum ArrayBufferStorage: Sendable {
  case ownedNative(NativeArrayBufferStorage)
  case nativeBacked(NativeArrayBufferStorage)
  case javaScriptBacked(JavaScriptBackedArrayBufferView)

  var nativePointer: UnsafeMutableRawPointer? {
    switch self {
    case .ownedNative(let storage), .nativeBacked(let storage):
      return storage.pointer
    case .javaScriptBacked:
      return nil
    }
  }

  var byteLength: Int {
    switch self {
    case .ownedNative(let storage), .nativeBacked(let storage):
      return storage.byteLength
    case .javaScriptBacked(let view):
      return view.byteLength
    }
  }

  var isNativeBacked: Bool {
    switch self {
    case .ownedNative, .nativeBacked:
      return true
    case .javaScriptBacked:
      return false
    }
  }

  func cleanup() {
    switch self {
    case .ownedNative(let storage), .nativeBacked(let storage):
      storage.cleanup()
    case .javaScriptBacked:
      break
    }
  }
}

private final class JavaScriptBackedArrayBufferView: @unchecked Sendable {
  let runtime: JavaScriptRuntime
  let backingValue: JavaScriptValue
  let byteOffset: Int
  let byteLength: Int

  init(runtime: JavaScriptRuntime, backingValue: JavaScriptValue, byteOffset: Int, byteLength: Int) {
    self.runtime = runtime
    self.backingValue = backingValue
    self.byteOffset = byteOffset
    self.byteLength = byteLength
  }

  @available(*, noasync)
  func withUnsafeBytes<R: Sendable>(
    _ body: @escaping (UnsafeRawBufferPointer) throws -> R
  ) throws -> R {
    let body = NonisolatedUnsafeVar(body)
    return try runtime.execute {
      return try self.withUnsafeBytesOnJavaScriptThread(body.value)
    }
  }

  func withUnsafeBytes<R: Sendable>(
    _ body: @escaping (UnsafeRawBufferPointer) throws -> R
  ) async throws -> R {
    let body = NonisolatedUnsafeVar(body)
    return try await runtime.execute {
      return try self.withUnsafeBytesOnJavaScriptThread(body.value)
    }
  }

  @available(*, noasync)
  func withUnsafeMutableBytes<R: Sendable>(
    _ body: @escaping (UnsafeMutableRawBufferPointer) throws -> R
  ) throws -> R {
    let body = NonisolatedUnsafeVar(body)
    return try runtime.execute {
      return try self.withUnsafeMutableBytesOnJavaScriptThread(body.value)
    }
  }

  func withUnsafeMutableBytes<R: Sendable>(
    _ body: @escaping (UnsafeMutableRawBufferPointer) throws -> R
  ) async throws -> R {
    let body = NonisolatedUnsafeVar(body)
    return try await runtime.execute {
      return try self.withUnsafeMutableBytesOnJavaScriptThread(body.value)
    }
  }

  @JavaScriptActor
  private func withUnsafeBytesOnJavaScriptThread<R>(
    _ body: (UnsafeRawBufferPointer) throws -> R
  ) throws -> R {
    let arrayBuffer = backingValue.getArrayBuffer()
    try validateBounds(arrayBuffer)
    return try body(UnsafeRawBufferPointer(start: arrayBuffer.data().advanced(by: byteOffset), count: byteLength))
  }

  @JavaScriptActor
  private func withUnsafeMutableBytesOnJavaScriptThread<R>(
    _ body: (UnsafeMutableRawBufferPointer) throws -> R
  ) throws -> R {
    let arrayBuffer = backingValue.getArrayBuffer()
    try validateBounds(arrayBuffer)
    return try body(
      UnsafeMutableRawBufferPointer(start: arrayBuffer.data().advanced(by: byteOffset), count: byteLength))
  }

  @JavaScriptActor
  func asJavaScriptArrayBuffer(runtime targetRuntime: JavaScriptRuntime) -> JavaScriptArrayBuffer? {
    guard runtime == targetRuntime else {
      return nil
    }
    let arrayBuffer = backingValue.getArrayBuffer()
    guard byteOffset == 0, byteLength == arrayBuffer.size else {
      return nil
    }
    return arrayBuffer
  }

  @JavaScriptActor
  private func validateBounds(_ arrayBuffer: borrowing JavaScriptArrayBuffer) throws {
    let size = arrayBuffer.size
    guard byteOffset >= 0, byteLength >= 0, byteOffset <= size, byteLength <= size - byteOffset else {
      throw ArrayBufferJSBytesAccessException("JavaScript-backed ArrayBuffer view is out of bounds")
    }
  }
}

/// Serializes access to mutable `ArrayBufferStorage`.
///
/// The storage can be materialized from `.javaScriptBacked` into `.ownedNative` during unscoped
/// mutable access, so the mutable enum value is isolated behind this lock-protected wrapper.
private final class SynchronizedArrayBufferStorage: @unchecked Sendable {
  private var storage: ArrayBufferStorage
  private let lock = NSRecursiveLock()

  init(_ storage: ArrayBufferStorage) {
    self.storage = storage
  }

  deinit {
    storage.cleanup()
  }

  func withStorage<R>(_ body: (ArrayBufferStorage) throws -> R) rethrows -> R {
    lock.lock()
    defer { lock.unlock() }
    return try body(storage)
  }

  func withMutableStorage<R>(_ body: (inout ArrayBufferStorage) throws -> R) rethrows -> R {
    lock.lock()
    defer { lock.unlock() }
    return try body(&storage)
  }
}
