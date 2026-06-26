// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

public protocol AnySharedObject: AnyArgument, AnyObject {
  var sharedObjectId: SharedObjectId { get }
}

extension AnySharedObject {
  public static func getDynamicType() -> AnyDynamicType {
    return DynamicSharedObjectType(innerType: Self.self)
  }
}

open class SharedObject: AnySharedObject {
  /**
   An identifier of the native shared object that maps to the JavaScript object.
   When the object is not linked with any JavaScript object, its value is 0.
   */
  public internal(set) var sharedObjectId: SharedObjectId = 0

  /**
   An app context for which the shared object was created.
   */
  public internal(set) weak var appContext: AppContext?

  /**
   Weak reference to the native state that owns this `SharedObject` and bridges
   it to its JS counterpart. Populated by `SharedObjectRegistry.add` and used to
   recover the paired JS object without going through the registry's id table.
   */
  internal weak var nativeState: SharedObjectNativeState?

  /**
   The default public initializer of the shared object.
   */
  public init() {}

  /**
   A function that will be called before the object is removed from the registry.
   */
  open func sharedObjectWillRelease() {}

  /**
   A function that will be called after the object is removed from the registry.
   */
  open func sharedObjectDidRelease() {}

  /**
   Override this function to inform the JavaScript runtime that there is additional
   memory associated with a given JavaScript object that is not visible to the GC.
   This can be used if an object is known to exclusively retain some native memory,
   and may be used to guide decisions about when to run garbage collection.
   */
  open func getAdditionalMemoryPressure() -> Int {
    // The memory pressure is `0` by default. We can potentially use `class_getInstanceSize`,
    // but it only returns a size of the type which is usually relatively small
    // as it does not include virtual allocations such as binary data and images.
    // Thus, it makes more sense to just skip setting the pressure and make it opt-in.
    return 0
  }

  /**
   Returns the JavaScript value associated with the native shared object.
   */
  public func getJavaScriptValue() -> JavaScriptValue? {
    return appContext?.sharedObjectRegistry.toJavaScriptValue(self)
  }

  /**
   Returns the JavaScript shared object associated with the native shared object.
   */
  public func getJavaScriptObject() -> JavaScriptObject? {
    return appContext?.sharedObjectRegistry.toJavaScriptObject(self)
  }

  /**
   Backwards-compatible overload that forwards to `emit(event:payload:)`. Existing single-argument
   call sites keep working unchanged; the parameter has been renamed to `payload` to make the
   single-payload semantics explicit, so callers should migrate the label.
   */
  @available(*, deprecated, renamed: "emit(event:payload:)", message: "Use `emit(event:payload:)` and pass a single value (typically a dictionary). Multi-argument event emission is no longer supported.")
  public func emit<P: AnyArgument>(event: String, arguments: sending P) {
    emit(event: event, payload: arguments)
  }
}

extension SharedObject: EventEmitter {
  @JavaScriptActor
  public func withEventTarget<R>(_ body: (borrowing JavaScriptObject) throws -> R) rethrows -> R? {
    guard let target = getJavaScriptObject() else {
      return nil
    }
    return try body(target)
  }
}

// MARK: - Recovering the native object from JS

extension SharedObject {
  /// Recovers the native shared object paired with the given JS object, reading it off the object's
  /// `SharedObjectNativeState`. Callers holding a `JavaScriptValue` or borrowed `JavaScriptUnownedValue`
  /// convert it first via `asObject()` / `asObject(in:)`.
  ///
  /// Returns the base `SharedObject`. Callers wanting a concrete subclass use the `as:` overload, which
  /// performs a checked downcast.
  ///
  /// Throws `NotFoundException` when the object carries no native state.
  @JavaScriptActor
  public static func native(from jsObject: borrowing JavaScriptObject) throws -> SharedObject {
    guard let native = jsObject.getNativeState(as: SharedObjectNativeState.self)?.native else {
      throw NotFoundException()
    }
    return native
  }

  /// Recovers the native shared object and casts it to the given subclass, e.g.
  /// `SharedObject.native(from: jsObject, as: Cache.self)`. The target type is an explicit argument
  /// rather than inferred from the return type, so the checked cast can never be skipped by omitting a
  /// contextual type. `@inlinable` so the `as?` specializes in the caller's module as a plain
  /// concrete-class cast. Throws `TypeMismatchException` when the paired native object isn't `type`.
  @JavaScriptActor
  @inlinable
  public static func native<SharedObjectType: SharedObject>(
    from jsObject: borrowing JavaScriptObject,
    as type: SharedObjectType.Type
  ) throws -> SharedObjectType {
    let native = try native(from: jsObject)
    guard let typed = native as? SharedObjectType else {
      throw TypeMismatchException((expected: SharedObjectType.self, actual: Swift.type(of: native)))
    }
    return typed
  }

  /// Thrown when a JS object has no paired native object, for example a foreign JS object that carries
  /// no `SharedObjectNativeState`.
  internal final class NotFoundException: Exception, @unchecked Sendable {
    override var code: String {
      "ERR_NATIVE_SHARED_OBJECT_NOT_FOUND"
    }

    override var reason: String {
      "Unable to find the native shared object associated with given JavaScript object"
    }
  }

  /// Thrown when the native shared object paired with a JS object exists but isn't the expected subclass.
  /// `@usableFromInline` so `native(from:)`'s inlinable generic overloads can throw it.
  @usableFromInline
  internal final class TypeMismatchException: GenericException<(expected: Any.Type, actual: Any.Type)>, @unchecked Sendable {
    override var code: String {
      "ERR_NATIVE_SHARED_OBJECT_TYPE_MISMATCH"
    }

    override var reason: String {
      "Expected the native shared object to be '\(param.expected)', but found '\(param.actual)'"
    }
  }
}
