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

  mutating func materializeNativeStorageIfNeeded() throws {
    if nativeStorage == nil {
      self = try makeOwnedNativeStorageCopy()
    }
  }

  func makeOwnedNativeStorageCopy() throws -> ArrayBufferStorage {
    switch self {
    case .ownedNative(let nativeStorage), .nativeBacked(let nativeStorage):
      return Self.makeOwnedNativeStorageCopy(
        of: UnsafeRawPointer(nativeStorage.pointer), count: nativeStorage.byteLength)
    case .javaScriptBacked(let view):
      return try view.makeOwnedNativeStorageCopy()
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
      return makeEmptyOwnedNativeStorage()
    }
    guard let pointer else {
      preconditionFailure("ArrayBuffer storage copy requires a pointer for non-empty data")
    }
    let copy = UnsafeMutablePointer<UInt8>.allocate(capacity: count)
    copy.initialize(from: pointer.assumingMemoryBound(to: UInt8.self), count: count)
    return .ownedNative(
      NativeArrayBufferStorage(pointer: copy, byteLength: count) {
        copy.deallocate()
      })
  }

  static func makeEmptyOwnedNativeStorage() -> ArrayBufferStorage {
    let data = UnsafeMutablePointer<UInt8>.allocate(capacity: 0)
    return .ownedNative(
      NativeArrayBufferStorage(pointer: data, byteLength: 0) {
        data.deallocate()
      })
  }
}

/// Retains a JavaScript ArrayBuffer value and exposes a byte range through scoped runtime access.
///
/// This storage does not expose raw pointers directly. Callers must enter the JavaScript runtime
/// to read or mutate the current backing bytes, or materialize the view into native storage first.
final class JavaScriptBackedArrayBufferView: @unchecked Sendable {
  @JavaScriptActor
  private final class LongLivedState: LongLivedObject {
    let backingValue = JavaScriptValue.Ref()

    func allowRelease() {
      backingValue.release()
    }

    func getArrayBuffer() throws -> JavaScriptArrayBuffer {
      guard
        let arrayBuffer = try backingValue.withValue({
          value in try value?.getArrayBuffer()
        })
      else {
        throw ArrayBufferJSBytesAccessException("JavaScript-backed ArrayBuffer was released")
      }
      return arrayBuffer
    }
  }

  private weak var runtime: JavaScriptRuntime?
  private let longLivedState = LongLivedState()
  let byteOffset: Int
  let byteLength: Int

  @JavaScriptActor
  init(runtime: JavaScriptRuntime, backingValue: JavaScriptValue, byteOffset: Int, byteLength: Int) {
    self.runtime = runtime
    longLivedState.backingValue.reset(backingValue)
    runtime.longLivedObjects.add(longLivedState)
    self.byteOffset = byteOffset
    self.byteLength = byteLength
  }

  deinit {
    guard let runtime else {
      return
    }
    runtime.schedule(priority: .immediate) { [weak runtime, longLivedState] in
      guard let runtime else {
        return
      }
      runtime.longLivedObjects.remove(longLivedState)
      longLivedState.allowRelease()
    }
  }

  @available(*, noasync)
  func withUnsafeBytes<R: Sendable>(
    _ body: @escaping (UnsafeRawBufferPointer) throws -> R
  ) throws -> R {
    let body = NonisolatedUnsafeVar(body)
    guard let runtime else {
      throw ArrayBufferJSBytesAccessException("JavaScript runtime is no longer available")
    }
    return try runtime.execute {
      return try self.withUnsafeBytesOnJavaScriptThread(body.value)
    }
  }

  func withUnsafeBytes<R: Sendable>(
    _ body: @escaping (UnsafeRawBufferPointer) throws -> R
  ) async throws -> R {
    let body = NonisolatedUnsafeVar(body)
    guard let runtime else {
      throw ArrayBufferJSBytesAccessException("JavaScript runtime is no longer available")
    }
    return try await runtime.execute {
      return try self.withUnsafeBytesOnJavaScriptThread(body.value)
    }
  }

  @available(*, noasync)
  func withUnsafeMutableBytes<R: Sendable>(
    _ body: @escaping (UnsafeMutableRawBufferPointer) throws -> R
  ) throws -> R {
    let body = NonisolatedUnsafeVar(body)
    guard let runtime else {
      throw ArrayBufferJSBytesAccessException("JavaScript runtime is no longer available")
    }
    return try runtime.execute {
      return try self.withUnsafeMutableBytesOnJavaScriptThread(body.value)
    }
  }

  func withUnsafeMutableBytes<R: Sendable>(
    _ body: @escaping (UnsafeMutableRawBufferPointer) throws -> R
  ) async throws -> R {
    let body = NonisolatedUnsafeVar(body)
    guard let runtime else {
      throw ArrayBufferJSBytesAccessException("JavaScript runtime is no longer available")
    }
    return try await runtime.execute {
      return try self.withUnsafeMutableBytesOnJavaScriptThread(body.value)
    }
  }

  func makeOwnedNativeStorageCopy() throws -> ArrayBufferStorage {
    return try withUnsafeBytes { bytes in
      return ArrayBufferStorage.makeOwnedNativeStorageCopy(of: bytes.baseAddress, count: bytes.count)
    }
  }

  @JavaScriptActor
  private func withUnsafeBytesOnJavaScriptThread<R>(
    _ body: (UnsafeRawBufferPointer) throws -> R
  ) throws -> R {
    let arrayBuffer = try longLivedState.getArrayBuffer()
    try validateBounds(arrayBuffer)
    return try body(UnsafeRawBufferPointer(start: arrayBuffer.data().advanced(by: byteOffset), count: byteLength))
  }

  @JavaScriptActor
  private func withUnsafeMutableBytesOnJavaScriptThread<R>(
    _ body: (UnsafeMutableRawBufferPointer) throws -> R
  ) throws -> R {
    let arrayBuffer = try longLivedState.getArrayBuffer()
    try validateBounds(arrayBuffer)
    return try body(
      UnsafeMutableRawBufferPointer(start: arrayBuffer.data().advanced(by: byteOffset), count: byteLength))
  }

  @JavaScriptActor
  func asJavaScriptArrayBuffer(runtime targetRuntime: JavaScriptRuntime) -> JavaScriptArrayBuffer? {
    guard runtime?.id == targetRuntime.id,
      targetRuntime.isOnJavaScriptThread()
    else {
      return nil
    }
    guard let arrayBuffer = try? longLivedState.getArrayBuffer() else {
      return nil
    }
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
  private let storage: Mutex<ArrayBufferStorage>

  init(_ storage: ArrayBufferStorage) {
    self.storage = Mutex(storage)
  }

  deinit {
    storage.withLock { storage in
      storage.cleanup()
    }
  }

  func withStorage<R>(_ body: (ArrayBufferStorage) throws -> R) rethrows -> R {
    return try storage.withLock { storage in
      try body(storage)
    }
  }

  func currentStorage() -> ArrayBufferStorage {
    return storage.withLock { storage in
      storage
    }
  }

  func publishMaterializedStorage(_ materializedStorage: ArrayBufferStorage) -> ArrayBufferStorage {
    return storage.withLock { storage in
      if storage.nativeStorage == nil {
        storage = materializedStorage
        return materializedStorage
      }
      materializedStorage.cleanup()
      return storage
    }
  }
}
