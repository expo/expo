// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/// Native state attached to a `SharedObject`'s JS object(s). Holds the paired native `SharedObject` so
/// callers that already have the JS object can recover the native counterpart via
/// `JavaScriptObject.getNativeState(as:)` without going through `SharedObjectRegistry`.
///
/// The registry creates the native state of a native object in the main runtime of the app context, which
/// is the owner runtime. Every other runtime that the native object is exposed to (for example the worklet
/// UI runtime) gets a native state of its own (see ``javaScriptObject(in:objectId:makeObject:)``), so the C++ state of
/// a JS object, including its event listeners, never holds values of another runtime. These runtime native
/// states point to the owner's native state, which tracks the release of the native object.
///
/// `@unchecked Sendable`: the native object and the owner are immutable. The JS objects are read and written
/// only on the thread of the runtime they belong to. The release flag can be read on any thread, but it only
/// changes from `false` to `true` and nothing is freed when it changes.
internal final class SharedObjectNativeState: JavaScriptNativeState, @unchecked Sendable {
  internal let native: SharedObject

  /// The native state that the registry created, or `nil` if this is that native state.
  private let owner: SharedObjectNativeState?

  /// The runtime that this native state was created for. The JS object in that runtime is kept in
  /// `ownerPairedObject`. JS objects in other runtimes are kept by those runtimes (see `PairedObjects`),
  /// so each runtime touches only its own JS objects, on its own thread.
  private let ownerRuntimeId: JavaScriptRuntime.ID?

  /// The JS object paired with the native object in the owner runtime, held weakly.
  private var ownerPairedObject: JavaScriptWeakObject?

  private var isReleasedFlag = false

  /// Whether the native object was released. A JS object can keep its native state after the release
  /// (for example a frozen one, whose native state can't be reset), so lookups check this flag.
  internal var isReleased: Bool {
    return owner?.isReleased ?? isReleasedFlag
  }

  internal init(native: SharedObject, ownerRuntimeId: JavaScriptRuntime.ID?, factory: @escaping JavaScriptNativeState.Factory) {
    self.native = native
    self.owner = nil
    self.ownerRuntimeId = ownerRuntimeId
    super.init(factory: factory)
  }

  /// Creates the native state of a runtime other than the owner runtime. Its C++ state has the same object ID,
  /// so `release()` in that runtime releases the native object, but no releaser: the garbage collection of
  /// that runtime's JS object doesn't release the native object.
  private init(owner: SharedObjectNativeState, runtime: JavaScriptRuntime, objectId: SharedObjectId) {
    self.native = owner.native
    self.owner = owner
    self.ownerRuntimeId = runtime.id
    super.init { context, deallocator in
      return SharedObjectUtils.makeSharedObjectNativeStatePtr(
        objectId: objectId,
        releaser: { _ in },
        context: context,
        contextDeallocator: deallocator
      )
    }
  }

  internal func markReleased() {
    isReleasedFlag = true
  }

  /// Records `jsObject` as the native object's JS counterpart in `runtime`. The caller is responsible
  /// for having attached this native state to `jsObject` (`jsObject.setNativeState(self)`).
  internal func setJavaScriptObject(_ jsObject: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) {
    if runtime.id == ownerRuntimeId {
      ownerPairedObject = jsObject.createWeak()
      return
    }
    JavaScriptActor.assumeIsolated {
      runtime.cached(pairedObjectsCacheKey, PairedObjects.init).set(jsObject, for: self)
    }
  }

  /// Returns the JS object paired with the native object in `runtime`, or `nil` if there is no live
  /// pairing there (none was created, or the JS object has been garbage-collected).
  internal func javaScriptObject(in runtime: borrowing JavaScriptRuntime) -> JavaScriptObject? {
    if runtime.id == ownerRuntimeId {
      // Unwrap the ref first so the optional doesn't nest with `withValue`'s, which would form a
      // `JavaScriptObject??` that the non-`Copyable` element can't be wrapped in.
      switch ownerPairedObject {
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

  /// Returns the JS object paired with the native object in `runtime`, a runtime other than the owner
  /// runtime. When there is none, it pairs the object that `makeObject` creates, with a native state of that runtime.
  @JavaScriptActor
  internal func javaScriptObject(
    in runtime: JavaScriptRuntime,
    objectId: SharedObjectId,
    makeObject: () throws -> JavaScriptObject
  ) throws -> JavaScriptObject {
    if let jsObject = javaScriptObject(in: runtime) {
      return jsObject
    }
    let jsObject = try makeObject()
    let runtimeNativeState = SharedObjectNativeState(owner: self, runtime: runtime, objectId: objectId)
    jsObject.setNativeState(runtimeNativeState)
    runtime.cached(pairedObjectsCacheKey, PairedObjects.init).set(jsObject, for: self)
    return jsObject
  }

  /// Whether `nativeState` is this native state, or a native state of another runtime that points to it.
  fileprivate func isSame(as nativeState: SharedObjectNativeState?) -> Bool {
    return nativeState === self || nativeState?.owner === self
  }
}

/// The JS objects that a runtime pairs with native objects whose native state was created for another runtime.
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
    guard nativeState.isSame(as: jsObject.getNativeState(as: SharedObjectNativeState.self)) else {
      return nil
    }
    return jsObject
  }
}

private let pairedObjectsCacheKey = JavaScriptRuntime.Cache.Key<PairedObjects>()
