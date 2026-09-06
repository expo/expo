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
      // The backing value is initialized only from a verified ArrayBuffer, so it can later
      // become empty but cannot change type — `getArrayBuffer()` is safe here.
      guard let arrayBuffer = backingValue.withValue({ $0?.getArrayBuffer() }) else {
        throw ArrayBufferJSBytesAccessException("JavaScript-backed ArrayBuffer was released")
      }
      return arrayBuffer
    }
  }

  private weak var runtime: JavaScriptRuntime?
  private let longLivedState = LongLivedState()
  // Captured at init so deinit can deregister through the collection, not the runtime: holding
  // the collection can't prolong the runtime's lifetime, and the queued cleanup no longer
  // depends on the runtime wrapper still existing when it drains.
  private let longLivedObjects: LongLivedObjectCollection
  let byteOffset: Int
  let byteLength: Int

  @JavaScriptActor
  init(runtime: JavaScriptRuntime, backingValue: JavaScriptValue, byteOffset: Int, byteLength: Int) {
    self.runtime = runtime
    self.longLivedObjects = runtime.longLivedObjects
    longLivedState.backingValue.reset(backingValue)
    runtime.longLivedObjects.add(longLivedState)
    self.byteOffset = byteOffset
    self.byteLength = byteLength
  }

  deinit {
    guard let runtime else {
      return
    }
    if runtime.isOnJavaScriptThread() {
      JavaScriptActor.assumeIsolated {
        longLivedObjects.remove(longLivedState)
        longLivedState.allowRelease()
      }
      return
    }
    guard runtime.supportsAsyncScheduling else {
      // Schedulerless runtimes deliberately keep the retained value alive until the
      // JavaScript-thread teardown sweep releases it.
      return
    }
    runtime.schedule(priority: .immediate) { [longLivedState, longLivedObjects] in
      longLivedObjects.remove(longLivedState)
      longLivedState.allowRelease()
    }
  }

  /// How long a synchronous off-thread access waits for the JavaScript thread before it is
  /// cancelled. Matches the Android `JSHeapAccessExecutor` sync timeout.
  static let defaultSyncAccessTimeout: TimeInterval = 5

  @available(*, noasync)
  func withUnsafeBytes<R: Sendable>(
    timeout: TimeInterval = JavaScriptBackedArrayBufferView.defaultSyncAccessTimeout,
    _ body: @escaping (UnsafeRawBufferPointer) throws -> R
  ) throws -> R {
    let body = NonisolatedUnsafeVar(body)
    return try executeSyncOnJavaScriptThread(timeout: timeout) {
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
    timeout: TimeInterval = JavaScriptBackedArrayBufferView.defaultSyncAccessTimeout,
    _ body: @escaping (UnsafeMutableRawBufferPointer) throws -> R
  ) throws -> R {
    let body = NonisolatedUnsafeVar(body)
    return try executeSyncOnJavaScriptThread(timeout: timeout) {
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

  /// Runs `work` synchronously on the JavaScript thread. Off-thread callers on a scheduler-backed
  /// runtime go through `JavaScriptThreadSyncAccess`, which bounds the wait so a blocked
  /// JavaScript thread surfaces as an error instead of deadlocking the caller.
  @available(*, noasync)
  private func executeSyncOnJavaScriptThread<R: Sendable>(
    timeout: TimeInterval,
    _ work: @escaping @JavaScriptActor () throws -> R
  ) throws -> R {
    guard let runtime else {
      throw ArrayBufferJSBytesAccessException("JavaScript runtime is no longer available")
    }
    guard !runtime.isOnJavaScriptThread(), runtime.supportsAsyncScheduling else {
      // On the JavaScript thread the work runs inline, and schedulerless runtimes execute
      // scheduled work synchronously — neither can wait on another thread, so no timeout applies.
      return try runtime.execute(work)
    }
    let access = JavaScriptThreadSyncAccess<R>()
    runtime.schedule(priority: .immediate) { [access] in
      guard access.begin() else {
        // A timed-out waiter cancelled this access before the JavaScript thread drained it.
        return
      }
      do {
        access.finish(.success(try work()))
      } catch {
        access.finish(.failure(error))
      }
    }
    return try access.awaitResult(timeout: timeout)
  }

  @JavaScriptActor
  private func withUnsafeBytesOnJavaScriptThread<R>(
    _ body: (UnsafeRawBufferPointer) throws -> R
  ) throws -> R {
    let arrayBuffer = try longLivedState.getArrayBuffer()
    try validateBounds(arrayBuffer)
    guard byteLength > 0 else {
      // A zero-length range passes bounds validation even for a detached buffer (size 0),
      // and there is nothing to read anyway, so never touch `data()` for it.
      return try body(UnsafeRawBufferPointer(start: nil, count: 0))
    }
    return try body(UnsafeRawBufferPointer(start: arrayBuffer.data().advanced(by: byteOffset), count: byteLength))
  }

  @JavaScriptActor
  private func withUnsafeMutableBytesOnJavaScriptThread<R>(
    _ body: (UnsafeMutableRawBufferPointer) throws -> R
  ) throws -> R {
    let arrayBuffer = try longLivedState.getArrayBuffer()
    try validateBounds(arrayBuffer)
    guard byteLength > 0 else {
      // A zero-length range passes bounds validation even for a detached buffer (size 0),
      // and there is nothing to mutate anyway, so never touch `data()` for it.
      return try body(UnsafeMutableRawBufferPointer(start: nil, count: 0))
    }
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

/// Coordinates one off-thread synchronous access to the JavaScript thread and bounds the wait,
/// mirroring the Android `JSHeapAccessExecutor.runOnQueueSync` contract: when the timeout expires,
/// the access is cancelled and throws only if the scheduled body has not started; a body that
/// already started only touches the backing bytes, so it is awaited without a bound. Without the
/// bound, a JavaScript thread that blocks on native state (for example a lock held by the thread
/// making this access) would deadlock both threads permanently.
final class JavaScriptThreadSyncAccess<R>: @unchecked Sendable {
  private enum Phase {
    case queued
    case running
    case finished
    case cancelled
  }

  private let condition = NSCondition()
  private var phase: Phase = .queued
  private var result: Result<R, any Error>?

  /// Marks the scheduled body as running. Returns `false` when a timed-out waiter already
  /// cancelled the access, in which case the body must not run.
  func begin() -> Bool {
    condition.lock()
    defer {
      condition.unlock()
    }
    guard phase == .queued else {
      return false
    }
    phase = .running
    return true
  }

  /// Publishes the body result and wakes the waiter.
  func finish(_ result: Result<R, any Error>) {
    condition.lock()
    self.result = result
    phase = .finished
    condition.broadcast()
    condition.unlock()
  }

  /// Blocks until the body finishes. When `timeout` expires before the body started, the access
  /// is cancelled and this throws `ArrayBufferJSBytesAccessException`.
  func awaitResult(timeout: TimeInterval) throws -> R {
    condition.lock()
    defer {
      condition.unlock()
    }
    let deadline = Date(timeIntervalSinceNow: timeout)
    while result == nil {
      if condition.wait(until: deadline) {
        continue
      }
      if phase == .queued {
        phase = .cancelled
        throw ArrayBufferJSBytesAccessException(
          "Timed out waiting for the JavaScript thread to run a synchronous access to a "
            + "JavaScript-backed ArrayBuffer. The JavaScript thread is likely blocked (for example "
            + "on a lock held by the thread making this access) or shutting down. Use the async "
            + "`withJSBytes(_:)`/`withMutableJSBytes(_:)` variants off the JavaScript thread, or "
            + "avoid blocking the JavaScript thread while native code accesses the buffer")
      }
      // The body already started on the JavaScript thread and holds a live pointer into the
      // JavaScript heap, so it cannot be cancelled — keep waiting for it to finish.
      while result == nil {
        condition.wait()
      }
    }
    guard let result else {
      preconditionFailure("Finished synchronous JavaScript-thread access must have a result")
    }
    return try result.get()
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
