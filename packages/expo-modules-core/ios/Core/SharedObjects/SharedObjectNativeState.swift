// Copyright 2026-present 650 Industries. All rights reserved.

@_spi(Internal) import ExpoModulesJSI
import os

/// Native state attached to a `SharedObject`'s JS object(s). Holds the paired native `SharedObject` so
/// callers that already have the JS object can recover the native counterpart via
/// `JavaScriptObject.getNativeState(as:)` without going through `SharedObjectRegistry`.
///
/// The JS objects of the native object in all runtimes (for example the main runtime and the worklet UI runtime)
/// share this native state and its C++ state. The C++ state is destroyed when the last of these JS objects is
/// collected, and then the deallocator of this native state releases the native object. The first JS object creates
/// the C++ state. The others get this native state only while that C++ state is alive (`setNativeStateIfAlive`), so
/// it has one C++ state.
///
/// The native state keeps the JS object and the event listeners of the main runtime only, so it holds values of the
/// main runtime only. The app context releases them before the main runtime is destroyed (see
/// ``releaseRuntimeValues()``). Each other runtime keeps its JS object and its listeners in its own cache (see
/// `PairedObjects`), and releases them when it is destroyed or the native object is released (see
/// ``releaseOtherRuntimeValues()``).
///
/// `@unchecked Sendable`: the native object is immutable. The JS objects and the listeners are read and written only on
/// the thread of the runtime they belong to. The flags are behind a lock, because the threads of all runtimes read them
/// and a release can come from any of them or from a garbage collector thread. `listeningRuntimes` is behind the lock
/// of the native object's `nativeState`.
internal final class SharedObjectNativeState: EventEmitterNativeState, @unchecked Sendable {
  /// The native object. The base class holds it.
  internal var native: SharedObject {
    return unsafeDowncast(instance.unsafelyUnwrapped as AnyObject, to: SharedObject.self)
  }

  /// The ID that the native object got with this native state. `release` and the `__expo_shared_object_id__` getter
  /// read it. The registry sets the ID of the native object to 0 when it releases the object, but a JS object that
  /// keeps the native state (for example a frozen one) still has this ID.
  internal let objectId: SharedObjectId

  /// The main runtime of the app context. The JS object in that runtime is kept in `pairedObject`. JS objects in
  /// other runtimes are kept by those runtimes (see `PairedObjects`), so each runtime touches only its own JS
  /// objects, on its own thread.
  private let mainRuntimeId: JavaScriptRuntime.ID?

  /// The schedulers of the runtimes other than the main runtime that have event listeners, by runtime ID. A native
  /// `emit` sends the event to each of them. Use it only under the lock of the native object's `nativeState`
  /// (`SharedObjectLock`), so that `emit` reads whether it is empty under the lock that it takes for the native state.
  @exclusivity(unchecked)
  private var listeningRuntimes: [JavaScriptRuntime.ID: JavaScriptRuntime.Scheduler] = [:]

  /// The JS object paired with the native object in the main runtime, held weakly.
  private var pairedObject: JavaScriptWeakObject?

  private struct Flags {
    var isReleased = false

    /// Whether a runtime other than the main runtime paired a JS object with this native state. Only then can the
    /// C++ state, with the values of the main runtime in it, outlive the main runtime.
    var isPairedInOtherRuntime = false
  }

  private let flags: OSAllocatedUnfairLock<Flags>

  /// Whether the native object was released. A JS object can keep its native state after the release
  /// (for example a frozen one, or one in another runtime), so lookups check this flag.
  internal var isReleased: Bool {
    return flags.withLock { $0.isReleased }
  }

  internal init(
    native: SharedObject,
    objectId: SharedObjectId,
    mainRuntimeId: JavaScriptRuntime.ID?,
    isPairedInOtherRuntime: Bool,
    releaser: @escaping (SharedObjectId) -> Void
  ) {
    self.objectId = objectId
    self.mainRuntimeId = mainRuntimeId
    self.flags = OSAllocatedUnfairLock(initialState: Flags(isPairedInOtherRuntime: isPairedInOtherRuntime))
    super.init(primaryRuntimeId: mainRuntimeId, instance: native)
    setDeallocator { _ in
      releaser(objectId)
    }
  }

  /// Marks the native object as released. Returns whether a runtime other than the main runtime paired a JS object
  /// with this native state.
  internal func markReleased() -> Bool {
    return flags.withLock { flags in
      flags.isReleased = true
      return flags.isPairedInOtherRuntime
    }
  }

  /// Records that a runtime other than the main runtime pairs a JS object with this native state. Call it before
  /// the native state is attached to that JS object. Returns `false`, and the native state must not be attached,
  /// when the native object was released: its release didn't account for that runtime.
  internal func markPairedInOtherRuntime() -> Bool {
    return flags.withLock { flags in
      guard !flags.isReleased else {
        return false
      }
      flags.isPairedInOtherRuntime = true
      return true
    }
  }

  /// Removes the event listeners and the JS object of the main runtime. Call it on the thread of the main runtime
  /// before the runtime is destroyed, because a JS object of another runtime can keep the native state alive for
  /// longer.
  internal func releaseRuntimeValues() {
    removePrimaryListeners()
    pairedObject = nil
  }

  /// Removes the JS objects and the event listeners that the runtimes with listeners, other than the main runtime, keep
  /// for this native state, on the thread of each runtime. Call it when the native object is released. A released
  /// native state gets no events, and a JS object released in its runtime has no native state, so JS can't remove its
  /// listeners. A listener that captures its JS object would keep both until the runtime is destroyed.
  internal func releaseOtherRuntimeValues() {
    let schedulers = SharedObjectLock.withLock(for: native) {
      defer {
        listeningRuntimes.removeAll()
      }
      return Array(listeningRuntimes.values)
    }
    for scheduler in schedulers {
      // The task holds the native state, so no new native state gets its identifier before the task runs.
      scheduler.schedule { runtime in
        runtime.cached(pairedObjectsCacheKey, PairedObjects.init).remove(self)
      }
    }
  }

  // MARK: - Listeners in other runtimes

  @JavaScriptActor
  internal override func listeners(inOtherRuntime runtime: JavaScriptRuntime, creatingIfNeeded: Bool) -> EventListeners? {
    return runtime.cached(pairedObjectsCacheKey, PairedObjects.init)
      .listeners(for: self, creatingIfNeeded: creatingIfNeeded, in: runtime)
  }

  @JavaScriptActor
  internal override func listenersDidChange(in runtime: JavaScriptRuntime, hasListeners: Bool) {
    guard runtime.id != mainRuntimeId else {
      return
    }
    let scheduler = hasListeners ? runtime.scheduler : nil
    let removedScheduler: JavaScriptRuntime.Scheduler? = SharedObjectLock.withLock(for: native) {
      if let scheduler {
        listeningRuntimes[runtime.id] = scheduler
        return nil
      }
      return listeningRuntimes.removeValue(forKey: runtime.id)
    }
    withExtendedLifetime(removedScheduler) {}
  }

  /// Whether a runtime other than the main runtime has event listeners. Call it only under the lock of the native
  /// object's `nativeState`.
  internal var hasListeningRuntimesUnderLock: Bool {
    return !listeningRuntimes.isEmpty
  }

  /// Returns the schedulers of the runtimes other than the main runtime that have event listeners. Forgets the
  /// runtimes that are gone.
  internal func listeningRuntimeSchedulers() -> [JavaScriptRuntime.Scheduler] {
    return SharedObjectLock.withLock(for: native) {
      if listeningRuntimes.values.contains(where: { !$0.mayBeAlive }) {
        listeningRuntimes = listeningRuntimes.filter { _, scheduler in
          return scheduler.mayBeAlive
        }
      }
      return Array(listeningRuntimes.values)
    }
  }

  /// Calls the listeners of the event in a runtime other than the main runtime with the payload that `encode` creates,
  /// and the JS object in that runtime as `this`. It converts the payload only when the event has listeners there.
  @JavaScriptActor
  internal func dispatchEvent(
    event: String,
    inOtherRuntime runtime: JavaScriptRuntime,
    encode: () throws -> JavaScriptValue
  ) throws {
    guard !isReleased else {
      return
    }
    guard let listeners = listeners(inOtherRuntime: runtime, creatingIfNeeded: false), !listeners.isEmpty else {
      // The JS object of the runtime was collected with its listeners, so the runtime doesn't need the events anymore.
      listenersDidChange(in: runtime, hasListeners: false)
      return
    }
    guard let eventListeners = listeners.listeners(of: event), let target = javaScriptObject(in: runtime) else {
      return
    }
    EventListeners.call(eventListeners, this: target, payload: try encode(), in: runtime)
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
  /// When there is none, it pairs the object that `makeObject` creates. Returns `nil` when the native object was
  /// released or the C++ state was destroyed, because a new C++ state would release the native object a second time.
  @JavaScriptActor
  internal func javaScriptObject(in runtime: JavaScriptRuntime, makeObject: () throws -> JavaScriptObject) throws -> JavaScriptObject? {
    if let jsObject = javaScriptObject(in: runtime) {
      return jsObject
    }
    guard markPairedInOtherRuntime() else {
      return nil
    }
    let jsObject = try makeObject()
    guard jsObject.setNativeStateIfAlive(self) else {
      return nil
    }
    SharedObjectRegistry.setUpJavaScriptObject(jsObject, of: native)
    runtime.cached(pairedObjectsCacheKey, PairedObjects.init).set(jsObject, for: self)
    return jsObject
  }
}

/// The JS objects that a runtime other than the main runtime pairs with native objects, and their event listeners.
/// Each runtime keeps its own in its cache, so they are used only on the thread of that runtime and are
/// released together with the runtime.
private final class PairedObjects {
  /// The JS object of a native object, held weakly, and its event listeners.
  private final class Pairing {
    let object: JavaScriptWeakObject.Ref
    var listeners: EventListeners?

    init(object: JavaScriptWeakObject.Ref) {
      self.object = object
    }
  }

  private var pairings: [ObjectIdentifier: Pairing] = [:]

  /// The number of objects above which `set(_:for:)` removes the objects that were garbage-collected, together with
  /// their listeners.
  private var pruneThreshold = 64

  func set(_ jsObject: borrowing JavaScriptObject, for nativeState: SharedObjectNativeState) {
    if pairings.count >= pruneThreshold {
      pairings = pairings.filter { _, pairing in
        return pairing.object.withValue { $0?.lock() != nil } ?? false
      }
      pruneThreshold = max(64, pairings.count * 2)
    }
    pairings[ObjectIdentifier(nativeState)] = Pairing(object: jsObject.createWeak().ref())
  }

  /// Removes the JS object of the native state and its listeners.
  func remove(_ nativeState: SharedObjectNativeState) {
    pairings[ObjectIdentifier(nativeState)] = nil
  }

  func object(for nativeState: SharedObjectNativeState) -> JavaScriptObject? {
    guard let pairing = pairings[ObjectIdentifier(nativeState)] else {
      return nil
    }
    return object(of: pairing, for: nativeState)
  }

  /// Returns the listeners of the JS object of the native state, and creates them when `creatingIfNeeded` is `true`.
  /// Returns `nil` when the native state has no live JS object here.
  func listeners(
    for nativeState: SharedObjectNativeState,
    creatingIfNeeded: Bool,
    in runtime: JavaScriptRuntime
  ) -> EventListeners? {
    guard let pairing = pairings[ObjectIdentifier(nativeState)], object(of: pairing, for: nativeState) != nil else {
      return nil
    }
    if pairing.listeners == nil && creatingIfNeeded {
      pairing.listeners = EventListeners(in: runtime)
    }
    return pairing.listeners
  }

  private func object(of pairing: Pairing, for nativeState: SharedObjectNativeState) -> JavaScriptObject? {
    guard let jsObject = pairing.object.withValue({ $0?.lock() }) else {
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
