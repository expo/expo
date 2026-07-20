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

  /// The JS object paired with the native object in each runtime, keyed by runtime identity and held
  /// weakly. One native object can be exposed to several runtimes (e.g. the main and UI runtimes, or
  /// worklet contexts), each with its own JS counterpart.
  private var pairedObjects: [JavaScriptRuntime.ID: JavaScriptRef<JavaScriptWeakObject>] = [:]

  internal init(native: SharedObject, factory: @escaping JavaScriptNativeState.Factory) {
    self.native = native
    super.init(factory: factory)
  }

  /// Records `jsObject` as the native object's JS counterpart in `runtime`. The caller is responsible
  /// for having attached this native state to `jsObject` (`jsObject.setNativeState(self)`), which reuses
  /// the shared C++ pointee across runtimes.
  internal func setJavaScriptObject(_ jsObject: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) {
    // Drop entries whose runtime or JS object has gone away before inserting, so the map doesn't
    // accumulate dead keys for runtimes that paired once and were torn down.
    pruneExpired()
    pairedObjects[runtime.id] = jsObject.createWeak().ref()
  }

  /// Returns the JS object paired with the native object in `runtime`, or `nil` if there is no live
  /// pairing there (none was created, or the JS object has been garbage-collected).
  internal func javaScriptObject(in runtime: JavaScriptRuntime) -> JavaScriptObject? {
    // Unwrap the ref first so the dictionary subscript's optional doesn't nest with `withValue`'s,
    // which would form a `JavaScriptObject??` that the non-`Copyable` element can't be wrapped in.
    guard let ref = pairedObjects[runtime.id] else {
      return nil
    }
    return ref.withValue { $0?.lock() }
  }

  private func pruneExpired() {
    pairedObjects = pairedObjects.filter { _, ref in
      // Keep the entry only while its weak JS object still resolves; an empty ref is dropped.
      return ref.withValue { $0?.lock() != nil } ?? false
    }
  }
}
