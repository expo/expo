// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/// Native state attached to a `SharedObject`'s JS object(s). Holds the paired native `SharedObject` so
/// callers that already have the JS object can recover the native counterpart via
/// `JavaScriptObject.getNativeState(as:)` without going through `SharedObjectRegistry`.
///
/// A single instance is shared across every runtime the native object is exposed to: its underlying C++
/// `jsi::NativeState` is attached to each runtime's JS object (the same `shared_ptr`, reused via
/// `JavaScriptNativeState.acquireShared`), and this instance maps each runtime to its paired JS object so
/// the native object can recover *its* JS counterpart in any given runtime.
internal final class SharedObjectNativeState: JavaScriptNativeState {
  internal let native: SharedObject

  /// Whether the native object was released. A JS object can keep its native state after the release
  /// (for example a frozen one, whose native state can't be reset), so lookups check this flag.
  internal private(set) var isReleased = false

  /// The JS object paired with the native object in the first runtime it was paired in, held weakly.
  /// Most native objects are only exposed to one runtime, so that pairing skips the dictionary below.
  private var firstRuntimeId: JavaScriptRuntime.ID?
  private var firstPairedObject: JavaScriptWeakObject?

  /// The JS object paired with the native object in each other runtime, keyed by runtime identity and
  /// held weakly. One native object can be exposed to several runtimes (e.g. the main and UI runtimes,
  /// or worklet contexts), each with its own JS counterpart.
  private var pairedObjects: [JavaScriptRuntime.ID: JavaScriptWeakObject.Ref] = [:]

  internal init(native: SharedObject, factory: @escaping JavaScriptNativeState.Factory) {
    self.native = native
    super.init(factory: factory)
  }

  internal func markReleased() {
    isReleased = true
  }

  /// Records `jsObject` as the native object's JS counterpart in `runtime`. The caller is responsible
  /// for having attached this native state to `jsObject` (`jsObject.setNativeState(self)`), which reuses
  /// the shared C++ pointee across runtimes.
  internal func setJavaScriptObject(_ jsObject: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) {
    let runtimeId = runtime.id

    // Take the first slot when it's free, already belongs to this runtime, or its JS object is gone.
    if firstRuntimeId == nil || firstRuntimeId == runtimeId || !isFirstPairedObjectAlive() {
      firstRuntimeId = runtimeId
      firstPairedObject = jsObject.createWeak()
      if !pairedObjects.isEmpty {
        pairedObjects[runtimeId] = nil
      }
      return
    }
    // Drop entries whose runtime or JS object has gone away before inserting, so the map doesn't
    // accumulate dead keys for runtimes that paired once and were torn down.
    pruneExpired()
    pairedObjects[runtimeId] = jsObject.createWeak().ref()
  }

  /// Returns the JS object paired with the native object in `runtime`, or `nil` if there is no live
  /// pairing there (none was created, or the JS object has been garbage-collected).
  internal func javaScriptObject(in runtime: borrowing JavaScriptRuntime) -> JavaScriptObject? {
    let runtimeId = runtime.id

    // Unwrap the ref first so the optional doesn't nest with `withValue`'s, which would form a
    // `JavaScriptObject??` that the non-`Copyable` element can't be wrapped in.
    if runtimeId == firstRuntimeId {
      switch firstPairedObject {
      case .some(let weakObject):
        return weakObject.lock()
      case .none:
        return nil
      }
    }
    guard !pairedObjects.isEmpty, let ref = pairedObjects[runtimeId] else {
      return nil
    }
    return ref.withValue { $0?.lock() }
  }

  private func pruneExpired() {
    guard !pairedObjects.isEmpty else {
      return
    }
    pairedObjects = pairedObjects.filter { _, ref in
      return Self.isAlive(ref)
    }
  }

  private func isFirstPairedObjectAlive() -> Bool {
    switch firstPairedObject {
    case .some(let weakObject):
      return weakObject.lock() != nil
    case .none:
      return false
    }
  }

  /// Whether the weak ref still resolves to a JS object; an empty or missing ref doesn't.
  private static func isAlive(_ ref: JavaScriptWeakObject.Ref?) -> Bool {
    return ref?.withValue { $0?.lock() != nil } ?? false
  }
}
