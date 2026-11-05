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
  // `state`'s `Mutex`. `delete(_:)` can run on the thread that destroys a C++ native state, such as a
  // garbage collector thread, so it and `add` change the native object's ID and native state only under
  // the lock.
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
   Pass `inheritsBaseClass: true` when `jsObject` inherits from `expo.SharedObject.prototype`, whose getter
   already reads the ID from the native state. A plain object gets the ID as its own property instead.
   */
  @discardableResult
  internal func add(
    native nativeObject: SharedObject,
    javaScript jsObject: borrowing JavaScriptObject,
    inheritsBaseClass: Bool = false
  ) -> SharedObjectId {
    // Reuse the native state, and with it the ID, only while a live JS object in this runtime holds it.
    // That JS object keeps the C++ native state alive until `setNativeState` attaches it to `jsObject`.
    // Otherwise the C++ native state can be in destruction on another thread, and its release must not
    // apply to `jsObject`, so the native object gets a new native state and ID.
    // Loaded once: each read of the weak reference to the app context costs an atomic operation.
    let appContext = self.appContext
    let runtime = try? appContext?.runtime
    let pairedObject = pairedObjectHoldingNativeState(of: nativeObject, in: runtime)
    let existingNativeState = pairedObject != nil ? nativeObject.nativeState : nil
    let id = existingNativeState != nil ? nativeObject.sharedObjectId : pullNextId()

    // Assign the app context to the object.
    nativeObject.appContext = appContext

    // This property should be deprecated, but it's still used when passing as a view prop.
    // The base class prototype defines it as a getter, so only a plain object needs its own property.
    // Defining it calls `Object.defineProperty` in JS, a large part of the cost of pairing.
    // No option set literals here: they build the set through a generic initializer on every call.
    if !inheritsBaseClass {
      jsObject.defineProperty(sharedObjectIdPropertyName, value: id, options: .writable)
    }

    if let sharedRefType = nativeObject.sharedRefType {
      jsObject.defineProperty("nativeRefType", value: sharedRefType, options: JavaScriptObject.PropertyOptions())
    }

    let memoryPressure = nativeObject.getAdditionalMemoryPressure()
    if memoryPressure > 0 {
      jsObject.setExternalMemoryPressure(memoryPressure)
    }

    // Attach the C++ shared-object native state. Because `expo::SharedObject::NativeState`
    // inherits from `expo::EventEmitter::NativeState`, later `addListener` calls see an
    // existing native state (via the inheritance check) and don't overwrite it.
    let nativeState = existingNativeState ?? {
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
      return state
    }()

    // Index the native state by ID. `delete(_:)` reads the native object's ID and native state on any
    // thread, so they change under the same lock.
    state.withLock { state in
      state.pairs[id] = nativeState
      nativeObject.sharedObjectId = id
      nativeObject.nativeState = nativeState
    }

    // setNativeState calls acquireShared() synchronously, which retains `nativeState`
    // via Unmanaged.passRetained. That's the wrapper's only strong reference — once
    // the C++ pointee dies, the contextDeallocator releases it. Reattaching the same
    // native state to another runtime's JS object reuses that same C++ pointee.
    withExtendedLifetime(pairedObject) {
      jsObject.setNativeState(nativeState)
    }

    // The registry is scoped to its app context, so the JS object being paired here lives in that
    // context's runtime. Record the pairing under that runtime so the native object can recover this
    // JS counterpart via `native.nativeState?.javaScriptObject(in:)`.
    if let runtime {
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
        nativeState.markReleased()

        // Delete the entry from the dictionary.
        state.pairs[id] = nil

        // A native object that was paired again after its JS object died has a new native state and ID,
        // and stays paired.
        guard native.nativeState === nativeState else {
          return
        }
        native.sharedObjectWillRelease()
        // Reset an ID on the object.
        native.sharedObjectId = 0
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
    return nativeObject.object(in: runtime)
  }

  /// Returns the JS object paired with the native object in this registry's runtime, if it is alive and
  /// still holds the native object's native state.
  private func pairedObjectHoldingNativeState(of nativeObject: SharedObject, in runtime: JavaScriptRuntime?) -> JavaScriptObject? {
    guard let runtime,
      let nativeState = nativeObject.unreleasedNativeState,
      let pairedObject = nativeState.javaScriptObject(in: runtime),
      pairedObject.getNativeState(as: SharedObjectNativeState.self) === nativeState
    else {
      return nil
    }
    return pairedObject
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
