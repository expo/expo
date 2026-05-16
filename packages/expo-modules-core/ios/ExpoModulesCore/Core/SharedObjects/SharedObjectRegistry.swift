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
 A pair of matching native and JS objects. Uses a weak reference to the JS object
 so that the registry doesn't prevent JS garbage collection. The C++ NativeState
 deallocator removes the pair from the registry when the JS object is collected.
 */
internal final class SharedObjectPair: @unchecked Sendable {
  let native: SharedObject
  let javaScript: JavaScriptWeakObject

  init(native: SharedObject, javaScript: consuming JavaScriptWeakObject) {
    self.native = native
    self.javaScript = javaScript
  }
}

/**
 The registry of shared objects.
 */
public final class SharedObjectRegistry: Sendable {
  /**
   Weak reference to the app context for the registry.
   */
  private weak let appContext: AppContext?

  internal struct State: Sendable {
    /**
     A dictionary of shared object pairs.
     */
    var pairs = [SharedObjectId: SharedObjectPair]()

    /**
     The counter of IDs to assign to the shared object pairs.
     The next pair added to the registry will be saved using this ID.
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
   Returns a pair of shared objects with given ID or `nil` when there is no such pair in the registry.
   */
  internal func get(_ id: SharedObjectId) -> SharedObjectPair? {
    return state.withLock { state in
      return state.pairs[id]
    }
  }

  /**
   Adds a pair of native and JS shared object to the registry. Assigns a new shared object ID to these objects.
   */
  @discardableResult
  internal func add(native nativeObject: SharedObject, javaScript jsObject: borrowing JavaScriptObject) -> SharedObjectId {
    let id = pullNextId()

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

    // Save the pair in the dictionary with a weak reference to the JS object.
    state.withLock { state in
      state.pairs[id] = SharedObjectPair(native: nativeObject, javaScript: jsObject.createWeak())
    }

    // Attach the C++ shared-object native state. Because `expo::SharedObject::NativeState`
    // inherits from `expo::EventEmitter::NativeState`, later `addListener` calls see an
    // existing native state (via the inheritance check) and don't overwrite it.
    try? appContext?.runtime.withUnsafePointee { runtimePointer in
      jsObject.asValue().withUnsafePointee { valuePointer in
        SharedObjectUtils.setNativeState(
          runtimePointer: runtimePointer,
          valuePointer: UnsafeMutableRawPointer(mutating: valuePointer),
          objectId: id,
          releaser: delete(_:)
        )
      }
    }

    return id
  }

  /**
   Deletes the shared objects pair with a given ID.
   */
  internal func delete(_ id: SharedObjectId) {
    state.withLock { state in
      if let pair = state.pairs[id] {
        pair.native.sharedObjectWillRelease()
        // Reset an ID on the objects.
        pair.native.sharedObjectId = 0

        // Delete the pair from the dictionary.
        state.pairs[id] = nil
        pair.native.sharedObjectDidRelease()
      }
    }
  }

  /**
   Gets the native shared object that is paired with a given JS object.
   */
  @JavaScriptActor
  internal func toNativeObject(_ jsObject: borrowing JavaScriptObject) -> SharedObject? {
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
   Gets the JS shared object that is paired with a given native object.
   */
  internal func toJavaScriptObject(_ nativeObject: SharedObject) -> JavaScriptObject? {
    let pair = state.withLock { state in
      return state.pairs[nativeObject.sharedObjectId]
    }
    return pair?.javaScript.lock()
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
