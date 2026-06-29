// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation

/// Stores a native-memory byte range and the cleanup closure that owns or retains it.
///
/// This is `@unchecked Sendable` because Swift cannot prove raw pointer safety, but
/// `ArrayBufferStorage` only exposes this storage after native memory has been retained.
struct NativeArrayBufferStorage: @unchecked Sendable {
  let pointer: UnsafeMutableRawPointer
  let byteLength: Int
  let cleanup: () -> Void
}

/// Describes the storage mode used by `ArrayBuffer`.
///
/// `.ownedNative` owns allocated native memory, `.nativeBacked` retains a borrowed native
/// JSI `MutableBuffer`, and `.javaScriptBacked` is scoped to JavaScript runtime access.
enum ArrayBufferStorage: Sendable {
  case ownedNative(NativeArrayBufferStorage)
  case nativeBacked(NativeArrayBufferStorage)
  case javaScriptBacked(JavaScriptBackedArrayBufferView)

  var nativeStorage: NativeArrayBufferStorage? {
    switch self {
    case .ownedNative(let storage), .nativeBacked(let storage):
      return storage
    case .javaScriptBacked:
      return nil
    }
  }

  var nativePointer: UnsafeMutableRawPointer? {
    return nativeStorage?.pointer
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

  mutating func materializeNativeStorageIfNeeded() {
    if nativeStorage == nil {
      self = makeOwnedNativeStorageCopy()
    }
  }

  func makeOwnedNativeStorageCopy() -> ArrayBufferStorage {
    switch self {
    case .ownedNative(let nativeStorage), .nativeBacked(let nativeStorage):
      return Self.makeOwnedNativeStorageCopy(
        of: UnsafeRawPointer(nativeStorage.pointer), count: nativeStorage.byteLength)
    case .javaScriptBacked(let view):
      return view.makeOwnedNativeStorageCopy()
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

  static func makeOwnedNativeStorageCopy(of pointer: UnsafeRawPointer?, count: Int) -> ArrayBufferStorage {
    if count == 0 {
      let data = UnsafeMutablePointer<UInt8>.allocate(capacity: 0)
      return .ownedNative(
        NativeArrayBufferStorage(pointer: data, byteLength: 0) {
          data.deallocate()
        })
    }
    guard let pointer else {
      preconditionFailure("ArrayBuffer storage copy should have a base address")
    }
    let copy = UnsafeMutablePointer<UInt8>.allocate(capacity: count)
    copy.initialize(from: pointer.assumingMemoryBound(to: UInt8.self), count: count)
    return .ownedNative(
      NativeArrayBufferStorage(pointer: copy, byteLength: count) {
        copy.deallocate()
      })
  }
}

/// Retains a JavaScript ArrayBuffer value and exposes a byte range through scoped runtime access.
///
/// This storage does not expose raw pointers directly. Callers must enter the JavaScript runtime
/// to read or mutate the current backing bytes, or materialize the view into native storage first.
final class JavaScriptBackedArrayBufferView: @unchecked Sendable {
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

  func makeOwnedNativeStorageCopy() -> ArrayBufferStorage {
    do {
      return try withUnsafeBytes { bytes in
        return ArrayBufferStorage.makeOwnedNativeStorageCopy(of: bytes.baseAddress, count: bytes.count)
      }
    } catch {
      preconditionFailure("Failed to materialize JavaScript-backed ArrayBuffer storage: \(error)")
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
/// access, so the mutable enum value is isolated behind this lock-protected wrapper.
final class SynchronizedArrayBufferStorage: @unchecked Sendable {
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
