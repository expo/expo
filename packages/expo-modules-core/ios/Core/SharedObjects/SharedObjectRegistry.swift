// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 Type of the IDs of shared objects.
 */
public typealias SharedObjectId = Int

/**
 Property name of the JS object where the shared object ID is stored.
 */
let sharedObjectIdPropertyName = "__expo_shared_object_id__"

/**
 The registry of shared objects.
 */
public final class SharedObjectRegistry: Sendable {
  /**
   Weak reference to the app context for the registry.
   */
  private weak let appContext: AppContext?

  // `@unchecked` because `SharedObjectNativeState` isn't `Sendable` (its JSI base class isn't), yet a
  // value escapes `withLock` whenever `get`/the lookups return it. Access is always serialized through
  // `state`'s `Mutex`. `remove(_:keepingUntilDestroyed:)` can run on the thread that destroys a C++ native
  // state, such as a garbage collector thread.
  internal struct State: @unchecked Sendable {
    /**
     Maps each shared object id to the native object's `SharedObjectNativeState`, which carries the
     native object and its per-runtime JS counterparts. The state is held strongly so an id stays
     resolvable via `get(_:)` until an explicit `delete(_:)`, independent of JS garbage collection.
     */
    var pairs = [SharedObjectId: SharedObjectNativeState]()

    /**
     The native states that were released while another runtime pairs a JS object with them. That JS object can hold
     the C++ state, with values of the main runtime in it, after the main runtime is destroyed. `clear()` releases
     those values. An entry is removed when its C++ state is destroyed.
     */
    var releasedNativeStates = [SharedObjectId: SharedObjectNativeState]()

    /**
     The counter of IDs to assign to the shared objects.
     The next object added to the registry will be saved using this ID.
     */
    var nextId: SharedObjectId = 1
  }

  private let state = Mutex(State())

  /**
   The next shared object ID, exposed for testing.
   */
  internal var nextId: SharedObjectId {
    return state.withLock {
      return $0.nextId
    }
  }

  /**
   A number of all pairs stored in the registry.
   */
  internal var size: Int {
    return state.withLock {
      return $0.pairs.count
    }
  }

  /**
   The default initializer that takes the app context.
   */
  internal init(appContext: AppContext) {
    self.appContext = appContext
  }

  /**
   Returns the next shared object ID and increases the counter.
   */
  @discardableResult
  internal func pullNextId() -> SharedObjectId {
    return state.withLock { state in
      let id = state.nextId
      state.nextId += 1
      return id
    }
  }

  /**
   Returns the native state registered under the given ID, or `nil` when there is no such entry.
   The state carries the native object (`native`) and its per-runtime JS counterparts.
   */
  internal func get(_ id: SharedObjectId) -> SharedObjectNativeState? {
    return state.withLock { state in
      return state.pairs[id]
    }
  }

  /**
   Adds a pair of native and JS shared object to the registry. The JS object gets the native state of the native
   object, and with it its ID, while a JS object of any runtime holds that native state. Otherwise the native object
   gets a new native state and ID.
   Pass `inheritsBaseClass: true` when `jsObject` inherits from `expo.SharedObject.prototype`, whose getter
   already reads the ID from the native state. A plain object gets the ID as its own property instead.
   */
  @discardableResult
  internal func add(
    native nativeObject: SharedObject,
    javaScript jsObject: borrowing JavaScriptObject,
    inheritsBaseClass: Bool = false,
    in runtime: JavaScriptRuntime? = nil
  ) -> SharedObjectId {
    // Loaded once: each read of the weak reference to the app context costs an atomic operation.
    let appContext = self.appContext
    let mainRuntime = try? appContext?.runtime
    let runtime = runtime ?? mainRuntime

    // Attach the C++ shared-object native state. Because `expo::SharedObject::NativeState`
    // inherits from `expo::EventEmitter::NativeState`, later `addListener` calls see an
    // existing native state (via the inheritance check) and don't overwrite it.
    // The existing C++ native state is attached only while it is alive. When it is destroyed on another
    // thread, its release must not apply to `jsObject`, so the native object gets a new native state and ID.
    let isMainRuntime = runtime?.id == mainRuntime?.id
    let (nativeState, id) = attachNativeState(
      of: nativeObject,
      to: jsObject,
      isMainRuntime: isMainRuntime,
      mainRuntimeId: mainRuntime?.id
    )

    // Assign the app context to the object.
    nativeObject.appContext = appContext

    // This property should be deprecated, but it's still used when passing as a view prop.
    // The base class prototype defines it as a getter, so only a plain object needs its own property.
    // Defining it calls `Object.defineProperty` in JS, a large part of the cost of pairing.
    // No option set literals here: they build the set through a generic initializer on every call.
    if !inheritsBaseClass {
      jsObject.defineProperty(sharedObjectIdPropertyName, value: id, options: .writable)
    }

    Self.setUpJavaScriptObject(jsObject, of: nativeObject)

    // The registry is scoped to its app context, so the JS object being paired here lives in that
    // context's runtime. Record the pairing under that runtime so the native object can recover this
    // JS counterpart via `native.nativeState?.javaScriptObject(in:)`.
    if let runtime {
      nativeState.setJavaScriptObject(jsObject, in: runtime)
    }

    return id
  }

  /// Attaches the registered native state of the native object to the JS object, or a new native state with a new ID,
  /// and returns the attached native state and its ID.
  private func attachNativeState(
    of nativeObject: SharedObject,
    to jsObject: borrowing JavaScriptObject,
    isMainRuntime: Bool,
    mainRuntimeId: JavaScriptRuntime.ID?
  ) -> (nativeState: SharedObjectNativeState, id: SharedObjectId) {
    while true {
      // A released native state, or one of another app context's registry, which holds values of another main runtime,
      // gets replaced.
      let current = nativeObject.nativeState
      if let current,
        current.registry === self,
        isMainRuntime ? !current.isReleased : current.markPairedInOtherRuntime(),
        jsObject.setNativeStateIfAlive(current)
      {
        return (current, current.objectId)
      }
      let id = pullNextId()
      let nativeState = SharedObjectNativeState(
        native: nativeObject,
        objectId: id,
        registry: self,
        mainRuntimeId: mainRuntimeId,
        isPairedInOtherRuntime: !isMainRuntime
      )

      // setNativeState calls acquireShared() synchronously, which retains `nativeState`
      // via Unmanaged.passRetained. Once the C++ pointee dies, the contextDeallocator releases it.
      // It runs before the native object is paired with the native state: another runtime attaches the native state of
      // the native object only while a JS object holds its C++ state.
      jsObject.setNativeState(nativeState)

      // Indexed before the pairing, so that `get(_:)` finds the ID that a JS object of another runtime gets with the
      // native state.
      state.withLock { state in
        state.pairs[id] = nativeState
      }

      // Another runtime can pair the native object on its thread after the read of `current` above. Then the loop
      // attaches that native state instead, so the JS objects of all runtimes share one native state.
      if nativeObject.pair(with: nativeState, id: id, replacing: current) {
        return (nativeState, id)
      }
      state.withLock { state in
        state.pairs[id] = nil
      }
    }
  }

  /// Defines `nativeRefType` on the JS object of a shared ref, and reports the memory that the native object holds to
  /// the garbage collector of the JS object's runtime. Each JS object of the native object needs it, in every runtime.
  internal static func setUpJavaScriptObject(_ jsObject: borrowing JavaScriptObject, of nativeObject: SharedObject) {
    if let sharedRefType = nativeObject.sharedRefType {
      jsObject.defineProperty("nativeRefType", value: sharedRefType, options: JavaScriptObject.PropertyOptions())
    }

    let memoryPressure = nativeObject.getAdditionalMemoryPressure()
    if memoryPressure > 0 {
      jsObject.setExternalMemoryPressure(memoryPressure)
    }
  }

  /**
   Deletes the shared objects pair with a given ID.
   */
  internal func delete(_ id: SharedObjectId) {
    get(id)?.release(reason: .released)
  }

  /// Releases the native object with the given ID, for `release()` called in JS. See
  /// `SharedObjectNativeState.release(reason:)`.
  internal func release(_ id: SharedObjectId, inMainRuntime: Bool) {
    get(id)?.release(reason: inMainRuntime ? .releasedInMainRuntime : .released)
  }

  /// Removes the native state that `SharedObjectNativeState.release(reason:)` released. With `keepingUntilDestroyed`,
  /// `clear()` still releases the values of the main runtime in it until its C++ state is destroyed.
  internal func remove(_ nativeState: SharedObjectNativeState, keepingUntilDestroyed: Bool) {
    let id = nativeState.objectId
    state.withLock { state in
      if state.pairs[id] === nativeState {
        state.pairs[id] = nil
      }
      if keepingUntilDestroyed {
        state.releasedNativeStates[id] = nativeState
      } else if !state.releasedNativeStates.isEmpty {
        state.releasedNativeStates[id] = nil
      }
    }
  }

  /**
   Gets the native shared object that is paired with a given JS object.
   */
  @JavaScriptActor
  internal func toNativeObject(_ jsObject: borrowing JavaScriptObject) -> SharedObject? {
    return try? SharedObject.native(from: jsObject)
  }

  /**
   Gets the JS value of the shared object that is paired with a given native object.
   */
  internal func toJavaScriptValue(_ nativeObject: SharedObject) -> JavaScriptValue? {
    return toJavaScriptObject(nativeObject)?.asValue()
  }

  /**
   Variant of `toJavaScriptValue(_:)` that looks up by id rather than by native object.
   */
  @JavaScriptActor
  internal func toJavaScriptValue(sharedObjectId id: SharedObjectId) -> JavaScriptValue? {
    guard let runtime = try? appContext?.runtime else {
      return nil
    }
    let nativeState = state.withLock { state in
      return state.pairs[id]
    }
    return nativeState?.javaScriptObject(in: runtime)?.asValue()
  }

  /**
   Gets the JS shared object that is paired with a given native object in this registry's runtime.
   */
  internal func toJavaScriptObject(_ nativeObject: SharedObject) -> JavaScriptObject? {
    guard let runtime = try? appContext?.runtime else {
      return nil
    }
    return nativeObject.object(in: runtime)
  }

  /**
   Creates a plain JS object and pairs it with a given native object.
   */
  internal func createSharedJavaScriptObject(runtime: JavaScriptRuntime, nativeObject: SharedObject) -> JavaScriptObject {
    let object = runtime.createObject()
    add(native: nativeObject, javaScript: object)
    return object
  }

  /**
   Ensures that there is a JS object paired with a given native object. If not, a plain JS object is created.
   */
  internal func ensureSharedJavaScriptObject(runtime: JavaScriptRuntime, nativeObject: SharedObject) -> JavaScriptObject {
    if let jsObject = toJavaScriptObject(nativeObject) {
      // JS object for this native object already exists in the registry, just return it.
      return jsObject
    }
    return createSharedJavaScriptObject(runtime: runtime, nativeObject: nativeObject)
  }

  /// Removes all pairs. Before that, the native states release the values of the runtime that created them, because
  /// a JS object of another runtime can keep a native state alive after that runtime is destroyed. This includes the
  /// released native states that such a JS object still holds.
  @JavaScriptActor
  internal func clear() {
    let nativeStates = state.withLock { state in
      defer {
        state.pairs.removeAll()
        state.releasedNativeStates.removeAll()
      }
      return Array(state.pairs.values) + Array(state.releasedNativeStates.values)
    }
    for nativeState in nativeStates {
      nativeState.releaseRuntimeValues()
      nativeState.native.endPairing(with: nativeState)
    }
  }
}
