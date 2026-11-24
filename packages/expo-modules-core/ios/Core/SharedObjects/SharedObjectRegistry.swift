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
     native object. The state is held strongly so an id stays resolvable via `get(_:)` until an
     explicit `delete(_:)`, independent of JS garbage collection.
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
   The state carries the native object (`native`).
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

    // Attach the shared-object native state. Each runtime keeps its JS object and its event listeners.
    // The existing C++ native state is attached only while it is alive. When it is destroyed on another
    // thread, its release must not apply to `jsObject`, so the native object gets a new native state and ID.
    let (nativeState, id) = attachNativeState(of: nativeObject, to: jsObject, mainRuntimeId: mainRuntime?.id)

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
    mainRuntimeId: JavaScriptRuntime.ID?
  ) -> (nativeState: SharedObjectNativeState, id: SharedObjectId) {
    while true {
      let registered = registeredNativeState(of: nativeObject)
      if let registered, jsObject.setNativeStateIfAlive(registered.nativeState) {
        return registered
      }
      let id = pullNextId()
      // Runs when the JS objects of all runtimes are collected.
      let releaser: (SharedObjectId) -> Void = { [weak self] id in
        self?.delete(id)
      }
      let nativeState = SharedObjectNativeState(
        native: nativeObject,
        objectId: id,
        mainRuntimeId: mainRuntimeId,
        releaser: releaser
      )

      // setNativeState calls acquireShared() synchronously, which retains `nativeState`
      // via Unmanaged.passRetained. Once the C++ pointee dies, the contextDeallocator releases it.
      // It runs before the native state is indexed: another runtime attaches an indexed native state only while
      // a JS object holds its C++ state.
      jsObject.setNativeState(nativeState)

      // Index the native state by ID. `delete(_:)` reads the native object's ID and native state on any
      // thread, so they change under the same lock. Another runtime can index a native state of the native object
      // on its thread after `registeredNativeState(of:)` above. Then the loop attaches that native state instead,
      // so the JS objects of all runtimes share one native state.
      let isIndexed = state.withLock { state in
        // The same test as `registeredNativeState(of:)`. The registry of another app context can give the native object
        // a native state with an ID that this registry uses for an older native state of the same native object.
        let current = nativeObject.nativeState
        let indexed = state.pairs[nativeObject.sharedObjectId] === current ? current : nil
        guard indexed === registered?.nativeState else {
          return false
        }
        state.pairs[id] = nativeState
        nativeObject.sharedObjectId = id
        nativeObject.nativeState = nativeState
        return true
      }
      if isIndexed {
        return (nativeState, id)
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

  /// Deletes the pair with the given ID, and removes the JS objects and the listeners that the runtimes with listeners
  /// keep for the native state. It runs when the native object is released, in JS or native code, and when the C++
  /// state is destroyed after the JS objects of all runtimes were collected, which can be on a garbage collector thread.
  internal func delete(_ id: SharedObjectId) {
    let deleted: (nativeState: SharedObjectNativeState, isCurrent: Bool)? = state.withLock { state in
      guard let nativeState = state.pairs[id] else {
        return nil
      }
      nativeState.markReleased()

      // Delete the entry from the dictionary.
      state.pairs[id] = nil

      // A native object that was paired again after its JS object died has a new native state and ID,
      // and stays paired.
      return (nativeState, nativeState.native.nativeState === nativeState)
    }
    guard let deleted else {
      return
    }
    let nativeState = deleted.nativeState
    nativeState.releaseRuntimeValues()
    guard deleted.isCurrent else {
      return
    }
    let native = nativeState.native
    // The hooks run without the lock: they can emit events whose listeners run inline on the JavaScript
    // thread and use the registry again, and the lock isn't reentrant.
    native.sharedObjectWillRelease()
    // Reset an ID on the object and end the pair, unless the hook paired it again.
    state.withLock { _ in
      if native.nativeState === nativeState {
        native.sharedObjectId = 0
        native.endPairing(with: nativeState)
      }
    }
    native.sharedObjectDidRelease()
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

  /// Returns the native state of the native object and its ID while this registry has it, that is, until it is
  /// released. A native state of another app context's registry has an ID and a main runtime of that app context.
  private func registeredNativeState(of nativeObject: SharedObject) -> (nativeState: SharedObjectNativeState, id: SharedObjectId)? {
    guard let nativeState = nativeObject.nativeState else {
      return nil
    }
    return state.withLock { state in
      let id = nativeObject.sharedObjectId
      return state.pairs[id] === nativeState ? (nativeState, id) : nil
    }
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

  /// Removes and ends all pairs. Each runtime releases the JS objects and the listeners that it keeps for the native
  /// states when it is destroyed.
  @JavaScriptActor
  internal func clear() {
    let nativeStates = state.withLock { state in
      defer {
        state.pairs.removeAll()
      }
      return Array(state.pairs.values)
    }
    for nativeState in nativeStates {
      nativeState.native.endPairing(with: nativeState)
    }
  }
}
