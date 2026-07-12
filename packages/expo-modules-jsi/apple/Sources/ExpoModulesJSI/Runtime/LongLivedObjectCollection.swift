/// An object whose lifetime must extend past the native call that created it, such as an in-flight
/// promise holding its resolve/reject state. Register it with a ``LongLivedObjectCollection``.
@JavaScriptActor
public protocol LongLivedObject: AnyObject {
  /// Called on the JavaScript thread when the runtime tears down while this object is still
  /// registered, to release any held JSI state. Not called on the normal completion path, where the
  /// object removes itself after releasing its own state.
  func allowRelease()
}

/// Keeps ``LongLivedObject``s alive across asynchronous boundaries and releases any that remain when
/// the runtime is torn down. Isolated to ``JavaScriptActor``, so it needs no lock.
@JavaScriptActor
public final class LongLivedObjectCollection {
  // Keyed by identity, effectively a set. A dictionary rather than a `Set` because
  // `any LongLivedObject` is an existential and cannot conform to `Hashable`.
  private var registeredObjects: [ObjectIdentifier: any LongLivedObject] = [:]

  // `nonisolated` so ``JavaScriptRuntime`` can create one as a stored-property default.
  internal nonisolated init() {}

  /// Registers an object, keeping it alive until it is removed or the collection is cleared.
  public func add(_ object: any LongLivedObject) {
    registeredObjects[ObjectIdentifier(object)] = object
  }

  /// Removes an object that finished on its own, without calling ``LongLivedObject/allowRelease()``.
  public func remove(_ object: any LongLivedObject) {
    registeredObjects[ObjectIdentifier(object)] = nil
  }

  /// Teardown sweep: calls ``LongLivedObject/allowRelease()`` on every remaining object and empties
  /// the collection. Must run on the JavaScript thread while the runtime is still valid.
  public func clear() {
    let survivors = registeredObjects.values
    registeredObjects.removeAll()
    for object in survivors {
      object.allowRelease()
    }
  }

  /// Number of currently registered objects.
  public var count: Int {
    return registeredObjects.count
  }
}
