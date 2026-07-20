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
  // `state`'s `Mutex` and the callers run on `JavaScriptActor`, so the unchecked assertion is sound.
  internal struct State: @unchecked Sendable {
    /**
     Maps each shared object id to the native object's `SharedObjectNativeState`, which carries the
     native object and its per-runtime JS counterparts. The state is held strongly so an id stays
     resolvable via `get(_:)` until an explicit `delete(_:)`, independent of JS garbage collection.
     */
    var pairs = [SharedObjectId: SharedObjectNativeState]()

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
   Adds a pair of native and JS shared object to the registry. Assigns a new shared object ID to these objects.
   */
  @discardableResult
  internal func add(native nativeObject: SharedObject, javaScript jsObject: borrowing JavaScriptObject) -> SharedObjectId {
    // A native object that already carries a native state was paired in an earlier runtime. Reuse its
    // id rather than minting a new one: the C++ `NativeState.objectId` is immutable and drives the
    // releaser/`delete`, so a fresh id would disagree with it and leak this object's registry entry.
    let id = nativeObject.nativeState != nil ? nativeObject.sharedObjectId : pullNextId()

    // Assign the ID and the app context to the object.
    nativeObject.sharedObjectId = id
    nativeObject.appContext = appContext

    // This property should be deprecated, but it's still used when passing as a view prop.
    // It's already defined in the JS base SharedObject class prototype,
    // but with the current implementation it's possible to use a raw object for registration.
    jsObject.defineProperty(sharedObjectIdPropertyName, value: id, options: [.writable])

    if let sharedRef = nativeObject as? AnySharedRef {
      jsObject.defineProperty("nativeRefType", value: sharedRef.nativeRefType, options: [])
    }

    let memoryPressure = nativeObject.getAdditionalMemoryPressure()
    if memoryPressure > 0 {
      jsObject.setExternalMemoryPressure(memoryPressure)
    }

    // Attach the C++ shared-object native state. Because `expo::SharedObject::NativeState`
    // inherits from `expo::EventEmitter::NativeState`, later `addListener` calls see an
    // existing native state (via the inheritance check) and don't overwrite it.
    //
    // A native object may already carry a native state from a previous pairing in another runtime.
    // Reuse it so all runtimes share one native state (and one underlying C++ pointee, via
    // `acquireShared`); a fresh state per runtime would leave `nativeObject.nativeState` pointing at
    // whichever ran last and lose the earlier runtimes' pairings.
    let nativeState = nativeObject.nativeState ?? {
      let releaser: ObjectReleaser = { [weak self] id in
        self?.delete(id)
      }
      let state = SharedObjectNativeState(native: nativeObject) { context, deallocator in
        return SharedObjectUtils.makeSharedObjectNativeStatePtr(
          objectId: id,
          releaser: releaser,
          context: context,
          contextDeallocator: deallocator
        )
      }
      nativeObject.nativeState = state
      return state
    }()

    // Index the native state by id. One entry per native object: re-pairing in another runtime stores
    // the same state under the same id (idempotent); the per-runtime JS counterparts live on the state.
    state.withLock { state in
      state.pairs[id] = nativeState
    }

    // setNativeState calls acquireShared() synchronously, which retains `nativeState`
    // via Unmanaged.passRetained. That's the wrapper's only strong reference — once
    // the C++ pointee dies, the contextDeallocator releases it. Reattaching the same
    // native state to another runtime's JS object reuses that same C++ pointee.
    jsObject.setNativeState(nativeState)

    // The registry is scoped to its app context, so the JS object being paired here lives in that
    // context's runtime. Record the pairing under that runtime so the native object can recover this
    // JS counterpart via `native.nativeState?.javaScriptObject(in:)`.
    if let runtime = try? appContext?.runtime {
      nativeState.setJavaScriptObject(jsObject, in: runtime)
    }

    return id
  }

  /**
   Deletes the shared objects pair with a given ID.
   */
  internal func delete(_ id: SharedObjectId) {
    state.withLock { state in
      if let nativeState = state.pairs[id] {
        let native = nativeState.native
        native.sharedObjectWillRelease()
        // Reset an ID on the object.
        native.sharedObjectId = 0

        // Delete the entry from the dictionary.
        state.pairs[id] = nil
        native.sharedObjectDidRelease()
      }
    }
  }

  /**
   Gets the native shared object that is paired with a given JS object.
   */
  @JavaScriptActor
  internal func toNativeObject(_ jsObject: borrowing JavaScriptObject) -> SharedObject? {
    if let native = try? SharedObject.native(from: jsObject) {
      return native
    }
    // Fallback to the id-based lookup for cases where the JS object was registered
    // through a path that doesn't attach a `SharedObjectNativeState` (e.g. worklet
    // proxies that currently rely on the `__expo_shared_object_id__` property).
    if let objectId = try? jsObject.getProperty(sharedObjectIdPropertyName).asInt() {
      return state.withLock { state in
        return state.pairs[objectId]?.native
      }
    }
    return nil
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
    // The id table and the native object both resolve to the same `SharedObjectNativeState`, which
    // owns the per-runtime JS counterparts, so a single lookup serves both. Prefer the native object's
    // own back-pointer and fall back to the id table for objects whose back-pointer was cleared.
    let nativeState = nativeObject.nativeState ?? state.withLock { state in
      return state.pairs[nativeObject.sharedObjectId]
    }
    return nativeState?.javaScriptObject(in: runtime)
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

  internal func clear() {
    state.withLock { state in
      state.pairs.removeAll()
    }
  }
}
