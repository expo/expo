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
/// The native state holds no values of a runtime. Each runtime keeps its JS object and its event listeners in its own
/// cache, at the slot of the native state (see `PairedObjects`), and releases them when it is destroyed. A runtime with
/// listeners also releases them when the native object is released or the JS objects of all runtimes are collected (see
/// ``releaseRuntimeValues()``). So the native state can outlive any runtime.
///
/// `@unchecked Sendable`: the native object and the slot are immutable. The JS objects and the listeners are read and
/// written only on the thread of the runtime they belong to. The released flag is behind a lock, because the threads of
/// all runtimes read it and a release can come from any of them or from a garbage collector thread.
/// `listeningRuntimes` and `runtimesWithListeners` are behind the lock of the native object's `nativeState`.
internal final class SharedObjectNativeState: EventEmitterNativeState, @unchecked Sendable {
  internal let native: SharedObject

  /// The ID that the native object got with this native state. `release` and the `__expo_shared_object_id__` getter
  /// read it. The registry sets the ID of the native object to 0 when it releases the object, but a JS object that
  /// keeps the native state (for example a frozen one) still has this ID.
  internal let objectId: SharedObjectId

  /// The main runtime of the app context. A native `emit` calls its listeners on its thread, and sends the event to the
  /// other runtimes only when they have listeners (`listeningRuntimes`).
  private let mainRuntimeId: JavaScriptRuntime.ID?

  /// The slot of the native state in the `PairedObjects` of every runtime.
  fileprivate let slot = pairingSlots.withLock { $0.take() }

  /// The schedulers of the runtimes other than the main runtime that have event listeners, by runtime ID. A native
  /// `emit` sends the event to each of them. Use it only under the lock of the native object's `nativeState`
  /// (`SharedObjectLock`), so that `emit` reads whether it is empty under the lock that it takes for the native state.
  @exclusivity(unchecked)
  private var listeningRuntimes: [JavaScriptRuntime.ID: JavaScriptRuntime.Scheduler] = [:]

  /// The schedulers of the runtimes that created event listeners for the native state, by runtime ID, so that a release
  /// removes the listeners on the thread of each runtime. Use it only under the lock of the native object's
  /// `nativeState`.
  @exclusivity(unchecked)
  private var runtimesWithListeners: [JavaScriptRuntime.ID: JavaScriptRuntime.Scheduler] = [:]

  private let releasedFlag = OSAllocatedUnfairLock(initialState: false)

  /// Whether the native object was released. A JS object can keep its native state after the release
  /// (for example a frozen one, or one in another runtime), so lookups check this flag.
  internal var isReleased: Bool {
    return releasedFlag.withLock { $0 }
  }

  internal init(
    native: SharedObject,
    objectId: SharedObjectId,
    mainRuntimeId: JavaScriptRuntime.ID?,
    releaser: @escaping (SharedObjectId) -> Void
  ) {
    self.native = native
    self.objectId = objectId
    self.mainRuntimeId = mainRuntimeId
    // No primary runtime: the listeners of every runtime are in the cache of that runtime.
    super.init(primaryRuntimeId: nil)
    setDeallocator { _ in
      releaser(objectId)
    }
  }

  deinit {
    let index = slot.index
    pairingSlots.withLock { $0.free(index) }
  }

  /// Marks the native object as released.
  internal func markReleased() {
    releasedFlag.withLock { $0 = true }
  }

  /// Removes the JS objects and the event listeners that the runtimes with listeners keep for this native state, on the
  /// thread of each runtime. Call it when the native object is released or the C++ state is destroyed, on any thread.
  /// After that, JS can't remove the listeners: a released native state gets no events, a JS object released in its
  /// runtime has no native state, and a collected JS object is gone. A listener that captures an object would keep it
  /// until the runtime is destroyed.
  internal func releaseRuntimeValues() {
    let schedulers = SharedObjectLock.withLock(for: native) {
      defer {
        runtimesWithListeners.removeAll()
        listeningRuntimes.removeAll()
      }
      return Array(runtimesWithListeners.values)
    }
    for scheduler in schedulers {
      // The task holds the native state, so no new native state gets its slot before the task runs.
      scheduler.schedule { runtime in
        withPairedObjects(in: runtime) { $0.remove(self) }
      }
    }
  }

  // MARK: - Listeners in each runtime

  @JavaScriptActor
  internal override func listeners(inOtherRuntime runtime: JavaScriptRuntime, creatingIfNeeded: Bool) -> EventListeners? {
    if let listeners = withPairedObjects(in: runtime, { $0.listeners(for: self) }) {
      return listeners
    }
    return creatingIfNeeded ? createListeners(in: runtime) : nil
  }

  /// Records the runtime so that a release removes its listeners, and creates them. Returns `nil` when the native object
  /// was released or the native state has no JS object in the runtime.
  @JavaScriptActor
  private func createListeners(in runtime: JavaScriptRuntime) -> EventListeners? {
    let scheduler = runtime.scheduler
    let replacedScheduler: JavaScriptRuntime.Scheduler? = SharedObjectLock.withLock(for: native) {
      return runtimesWithListeners.updateValue(scheduler, forKey: runtime.id)
    }
    withExtendedLifetime(replacedScheduler) {}
    // A release marks the native state as released before it takes `runtimesWithListeners`. So either the release
    // takes this runtime and removes the listeners, or this check sees the release.
    guard !isReleased else {
      return nil
    }
    return withPairedObjects(in: runtime) { $0.createListeners(for: self, in: runtime) }
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
      listenersDidChange(in: runtime, hasListeners: false)
      return
    }
    guard let eventListeners = listeners.listeners(of: event) else {
      return
    }
    guard let target = javaScriptObject(in: runtime) else {
      // The JS object of the runtime was collected, so the runtime doesn't need the events anymore.
      listenersDidChange(in: runtime, hasListeners: false)
      return
    }
    EventListeners.call(eventListeners, this: target, payload: try encode(), in: runtime)
  }

  /// Records `jsObject` as the native object's JS counterpart in `runtime`. The caller is responsible
  /// for having attached this native state to `jsObject` (`jsObject.setNativeState(self)`).
  internal func setJavaScriptObject(_ jsObject: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) {
    JavaScriptActor.assumeIsolated {
      withPairedObjects(in: runtime) { $0.set(jsObject, for: self) }
    }
  }

  /// Returns the JS object paired with the native object in `runtime`, or `nil` if there is no live
  /// pairing there (none was created, or the JS object has been garbage-collected).
  internal func javaScriptObject(in runtime: borrowing JavaScriptRuntime) -> JavaScriptObject? {
    return JavaScriptActor.assumeIsolated {
      // The pairing comes out of the closure, not the object: the closure result must be copyable.
      return withPairedObjects(in: runtime, { $0.pairing(for: self) })?.object.lock()
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
    guard !isReleased else {
      return nil
    }
    let jsObject = try makeObject()
    guard jsObject.setNativeStateIfAlive(self) else {
      return nil
    }
    SharedObjectRegistry.setUpJavaScriptObject(jsObject, of: native)
    withPairedObjects(in: runtime) { $0.set(jsObject, for: self) }
    return jsObject
  }
}

/// A slot of a native state in the `PairedObjects` of the runtimes. The index of a deallocated native state goes to a
/// new native state, with a new generation, so a runtime ignores what it still keeps for the old one.
private struct PairingSlot {
  let index: Int
  let generation: UInt64
}

/// The slots of the native states of all app contexts. A runtime can pair the native states of several app contexts, so
/// they share one set of indices.
private struct PairingSlots {
  private var freeIndices = ContiguousArray<Int>()
  private var count = 0
  private var lastGeneration: UInt64 = 0

  mutating func take() -> PairingSlot {
    lastGeneration += 1
    if let index = freeIndices.popLast() {
      return PairingSlot(index: index, generation: lastGeneration)
    }
    count += 1
    return PairingSlot(index: count - 1, generation: lastGeneration)
  }

  mutating func free(_ index: Int) {
    freeIndices.append(index)
  }
}

private let pairingSlots = Mutex(PairingSlots())

/// The JS objects that a runtime pairs with native objects, and their event listeners, at the slots of the native
/// states. Each runtime keeps its own in its cache, so they are used only on the thread of that runtime and are released
/// together with the runtime. When a native state is deallocated without listeners in the runtime, its weak JS object
/// stays until a new native state gets its slot and is paired in the runtime.
private final class PairedObjects {
  /// The JS object of a native object, held weakly, and its event listeners.
  fileprivate final class Pairing {
    /// The generation of the slot of the native state.
    let generation: UInt64

    let object: JavaScriptWeakObject

    @exclusivity(unchecked)
    var listeners: EventListeners?

    init(generation: UInt64, object: consuming JavaScriptWeakObject) {
      self.generation = generation
      self.object = object
    }
  }

  @exclusivity(unchecked)
  private var pairings = ContiguousArray<Pairing?>()

  /// Returns the pairing of the native state, or `nil` when the runtime has none.
  @inline(__always)
  func pairing(for nativeState: SharedObjectNativeState) -> Pairing? {
    let slot = nativeState.slot
    guard slot.index < pairings.count, let pairing = pairings[slot.index], pairing.generation == slot.generation else {
      return nil
    }
    return pairing
  }

  func set(_ jsObject: borrowing JavaScriptObject, for nativeState: SharedObjectNativeState) {
    let slot = nativeState.slot
    if slot.index >= pairings.count {
      pairings.append(contentsOf: repeatElement(nil, count: slot.index - pairings.count + 1))
    }
    let pairing = Pairing(generation: slot.generation, object: jsObject.createWeak())
    // Another JS object of the native state, for example one made after the first was collected, keeps the listeners.
    pairing.listeners = self.pairing(for: nativeState)?.listeners
    pairings[slot.index] = pairing
  }

  /// Removes the JS object of the native state and its listeners.
  func remove(_ nativeState: SharedObjectNativeState) {
    if pairing(for: nativeState) != nil {
      pairings[nativeState.slot.index] = nil
    }
  }

  /// Returns the listeners of the native state, or `nil` when it has none here.
  @inline(__always)
  func listeners(for nativeState: SharedObjectNativeState) -> EventListeners? {
    return pairing(for: nativeState)?.listeners
  }

  /// Creates the listeners of the native state. Returns `nil` when the native state has no JS object here.
  func createListeners(for nativeState: SharedObjectNativeState, in runtime: JavaScriptRuntime) -> EventListeners? {
    guard let pairing = pairing(for: nativeState) else {
      return nil
    }
    let listeners = EventListeners(in: runtime)
    pairing.listeners = listeners
    return listeners
  }
}

private let pairedObjectsCacheKey = JavaScriptRuntime.Cache.Key<PairedObjects>()

/// Calls `body` with the `PairedObjects` of the runtime, without retaining it. Creates it the first time. Returns what
/// `body` returns.
@JavaScriptActor
@inline(__always)
private func withPairedObjects<R>(
  in runtime: borrowing JavaScriptRuntime,
  _ body: (PairedObjects) throws -> R
) rethrows -> R {
  let value = runtime.unretainedCachedValue(for: pairedObjectsCacheKey) ?? createPairedObjects(in: runtime)
  // The cache keeps the value until the runtime is destroyed.
  return try value._withUnsafeGuaranteedRef(body)
}

/// Creates the `PairedObjects` of the runtime and returns it unretained, like `unretainedCachedValue(for:)`. Not
/// inlined, so that the generic cache call stays out of the callers.
@JavaScriptActor
@inline(never)
private func createPairedObjects(in runtime: borrowing JavaScriptRuntime) -> Unmanaged<PairedObjects> {
  return Unmanaged.passUnretained(runtime.cached(pairedObjectsCacheKey, PairedObjects.init))
}
