// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Type of the IDs of shared objects.
 */
public typealias SharedObjectId = Int

/**
 A tuple containing a pair of matching native and JS objects.
 */
internal typealias SharedObjectPair = (native: SharedObject, javaScript: JavaScriptWeakObject)

/**
 Property name of the JS object where the shared object ID is stored.
 */
let sharedObjectIdPropertyName = "__expo_shared_object_id__"

/**
 The registry of all shared objects used in the entire app.
 It's been made static for simplicity.
 */
public final class SharedObjectRegistry {
  /**
   The counter of IDs to assign to the shared object pairs.
   The next pair added to the registry will be saved using this ID.
   */
  internal static var nextId: SharedObjectId = 1

  /**
   A dictionary of shared object pairs.
   */
  internal static var pairs = [SharedObjectId: SharedObjectPair]()

  /**
   The lock queue to keep thread safety for internal data structures.
   */
  private static let lockQueue = DispatchQueue(label: "expo.modules.core.SharedObjectRegistry")

  /**
   A number of all pairs stored in the registry.
   */
  internal static var size: Int {
    return Self.lockQueue.sync {
      return pairs.count
    }
  }

  /**
   Returns the next shared object ID and increases the counter.
   */
  @discardableResult
  internal static func pullNextId() -> SharedObjectId {
    return Self.lockQueue.sync {
      let id = nextId
      nextId += 1
      return id
    }
  }

  /**
   Returns a pair of shared objects with given ID or `nil` when there is no such pair in the registry.
   */
  internal static func get(_ id: SharedObjectId) -> SharedObjectPair? {
    return Self.lockQueue.sync {
      return pairs[id]
    }
  }

  /**
   Adds a pair of native and JS shared object to the registry. Assigns a new shared object ID to these objects.
   */
  @discardableResult
  internal static func add(native nativeObject: SharedObject, javaScript jsObject: JavaScriptObject) -> SharedObjectId {
    let id = pullNextId()

    // Assigns the ID to the objects.
    nativeObject.sharedObjectId = id
    jsObject.defineProperty(sharedObjectIdPropertyName, value: id, options: [.writable])

    // Set the deallocator on the JS object that deletes the entire pair.
    jsObject.setObjectDeallocator { delete(id) }

    // Save the pair in the dictionary.
    let jsWeakObject = jsObject.createWeak()
    Self.lockQueue.async {
      pairs[id] = (native: nativeObject, javaScript: jsWeakObject)
    }

    return id
  }

  /**
   Deletes the shared objects pair with a given ID.
   */
  internal static func delete(_ id: SharedObjectId) {
    Self.lockQueue.async {
      if let pair = pairs[id] {
        // Reset an ID on the objects.
        pair.native.sharedObjectId = 0

        // Delete the pair from the dictionary.
        pairs[id] = nil
      }
    }
  }

  /**
   Gets the native shared object that is paired with a given JS object.
   */
  internal static func toNativeObject(_ jsObject: JavaScriptObject) -> SharedObject? {
    if let objectId = try? jsObject.getProperty(sharedObjectIdPropertyName).asInt() {
      return Self.lockQueue.sync {
        return pairs[objectId]?.native
      }
    }
    return nil
  }

  /**
   Gets the JS shared object that is paired with a given native object.
   */
  internal static func toJavaScriptObject(_ nativeObject: SharedObject) -> JavaScriptObject? {
    let objectId = nativeObject.sharedObjectId
    return Self.lockQueue.sync {
      return pairs[objectId]?.javaScript.lock()
    }
  }

  /**
   Creates a plain JS object and pairs it with a given native object.
   */
  internal static func createSharedJavaScriptObject(runtime: JavaScriptRuntime, nativeObject: SharedObject) -> JavaScriptObject {
    let object = runtime.createObject()
    add(native: nativeObject, javaScript: object)
    return object
  }

  /**
   Ensures that there is a JS object paired with a given native object. If not, a plain JS object is created.
   */
  internal static func ensureSharedJavaScriptObject(runtime: JavaScriptRuntime, nativeObject: SharedObject) -> JavaScriptObject {
    if let jsObject = toJavaScriptObject(nativeObject) {
      // JS object for this native object already exists in the registry, just return it.
      return jsObject
    }
    return createSharedJavaScriptObject(runtime: runtime, nativeObject: nativeObject)
  }

  internal static func clear() {
    Self.lockQueue.async {
      pairs.removeAll()
    }
  }
}
