// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import os

/// Native state attached to a `SharedObject`'s JS object(s). Holds the paired native `SharedObject` so
/// callers that already have the JS object can recover the native counterpart via
/// `JavaScriptObject.getNativeState(as:)` without going through `SharedObjectRegistry`.
///
/// The JS objects of the native object in all runtimes (for example the main runtime and the worklet UI runtime)
/// share this native state and its C++ state. The C++ state is destroyed, and its releaser releases the native
/// object, when the last of these JS objects is collected.
///
/// Only the main runtime can have event listeners in the C++ state (`addListener` throws in the other runtimes), and
/// only its JS object is kept here, so the native state holds values of the main runtime only. The app context
/// releases them before the main runtime is destroyed (see ``releaseRuntimeValues()``).
///
/// `@unchecked Sendable`: the native object is immutable. The JS objects are read and written only on the thread of
/// the runtime they belong to. The release flag is behind a lock, because the threads of all runtimes read it and
/// a release can come from any of them or from a garbage collector thread.
internal final class SharedObjectNativeState: JavaScriptNativeState, @unchecked Sendable {
  internal let native: SharedObject

  /// The main runtime of the app context. The JS object in that runtime is kept in `pairedObject`. JS objects in
  /// other runtimes are kept by those runtimes (see `PairedObjects`), so each runtime touches only its own JS
  /// objects, on its own thread.
  private let mainRuntimeId: JavaScriptRuntime.ID?

  /// The JS object paired with the native object in the main runtime, held weakly.
  private var pairedObject: JavaScriptWeakObject?

  /// The listeners in the C++ state, which belong to the main runtime.
  private let listeners: SharedObjectListeners

  private let isReleasedFlag = OSAllocatedUnfairLock(initialState: false)

  /// Whether the native object was released. A JS object can keep its native state after the release
  /// (for example a frozen one, or one in another runtime), so lookups check this flag.
  internal var isReleased: Bool {
    return isReleasedFlag.withLock { $0 }
  }

  internal init(native: SharedObject, objectId: SharedObjectId, mainRuntimeId: JavaScriptRuntime.ID?, releaser: @escaping ObjectReleaser) {
    let listeners = SharedObjectListeners()
    self.native = native
    self.mainRuntimeId = mainRuntimeId
    self.listeners = listeners
    super.init { context, deallocator in
      return SharedObjectUtils.makeSharedObjectNativeStatePtr(
        objectId: objectId,
        releaser: releaser,
        listeners: listeners,
        context: context,
        contextDeallocator: deallocator
      )
    }
  }

  internal func markReleased() {
    isReleasedFlag.withLock { $0 = true }
  }

  /// Removes the event listeners and the JS object of the main runtime. Call it on the thread of the main runtime
  /// before the runtime is destroyed, because a JS object of another runtime can keep the native state alive for
  /// longer.
  internal func releaseRuntimeValues() {
    listeners.clear()
    pairedObject = nil
  }

  /// Records `jsObject` as the native object's JS counterpart in `runtime`. The caller is responsible
  /// for having attached this native state to `jsObject` (`jsObject.setNativeState(self)`).
  internal func setJavaScriptObject(_ jsObject: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) {
    if runtime.id == mainRuntimeId {
      pairedObject = jsObject.createWeak()
      return
    }
    JavaScriptActor.assumeIsolated {
      runtime.cached(pairedObjectsCacheKey, PairedObjects.init).set(jsObject, for: self)
    }
  }

  /// Returns the JS object paired with the native object in `runtime`, or `nil` if there is no live
  /// pairing there (none was created, or the JS object has been garbage-collected).
  internal func javaScriptObject(in runtime: borrowing JavaScriptRuntime) -> JavaScriptObject? {
    if runtime.id == mainRuntimeId {
      // Unwrap the ref first so the optional doesn't nest with `withValue`'s, which would form a
      // `JavaScriptObject??` that the non-`Copyable` element can't be wrapped in.
      switch pairedObject {
      case .some(let weakObject):
        return weakObject.lock()
      case .none:
        return nil
      }
    }
    return JavaScriptActor.assumeIsolated {
      return runtime.cached(pairedObjectsCacheKey, PairedObjects.init).object(for: self)
    }
  }

  /// Returns the JS object paired with the native object in `runtime`, a runtime other than the main runtime.
  /// When there is none, it pairs the object that `makeObject` creates.
  @JavaScriptActor
  internal func javaScriptObject(in runtime: JavaScriptRuntime, makeObject: () throws -> JavaScriptObject) throws -> JavaScriptObject {
    if let jsObject = javaScriptObject(in: runtime) {
      return jsObject
    }
    let jsObject = try makeObject()
    jsObject.setNativeState(self)
    runtime.cached(pairedObjectsCacheKey, PairedObjects.init).set(jsObject, for: self)
    return jsObject
  }
}

/// The JS objects that a runtime other than the main runtime pairs with native objects.
/// Each runtime keeps its own in its cache, so they are used only on the thread of that runtime and are
/// released together with the runtime.
private final class PairedObjects {
  private var objects: [ObjectIdentifier: JavaScriptWeakObject.Ref] = [:]

  /// The number of objects above which `set(_:for:)` removes the objects that were garbage-collected.
  private var pruneThreshold = 64

  func set(_ jsObject: borrowing JavaScriptObject, for nativeState: SharedObjectNativeState) {
    if objects.count >= pruneThreshold {
      objects = objects.filter { _, ref in
        return ref.withValue { $0?.lock() != nil } ?? false
      }
      pruneThreshold = max(64, objects.count * 2)
    }
    objects[ObjectIdentifier(nativeState)] = jsObject.createWeak().ref()
  }

  func object(for nativeState: SharedObjectNativeState) -> JavaScriptObject? {
    guard let ref = objects[ObjectIdentifier(nativeState)], let jsObject = ref.withValue({ $0?.lock() }) else {
      return nil
    }
    // A new native state can get the identifier of a deallocated one, so check that the JS object
    // still holds this native state.
    guard jsObject.getNativeState(as: SharedObjectNativeState.self) === nativeState else {
      return nil
    }
    return jsObject
  }
}

private let pairedObjectsCacheKey = JavaScriptRuntime.Cache.Key<PairedObjects>()
