// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import os

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
   The native state that owns this `SharedObject` and bridges it to its JS counterpart, or `nil` when the object
   isn't paired. Populated by `SharedObjectRegistry.add` and used to recover the paired JS object without going
   through the registry's id table.

   The reference is strong: a weak reference would give the native state a side table, which makes every retain and
   release of it slower, also when a JS method finds it on its JS object. The native state holds this object too, so
   the registry ends the pair with `endPairing(with:)` when the object is released, when its JS objects are collected
   and when the registry is cleared. The registry changes it on any thread, so it is behind a lock.
   */
  internal var nativeState: SharedObjectNativeState? {
    get {
      return SharedObjectLock.withLock(for: self) {
        return pairedNativeState
      }
    }
    set {
      let oldValue = SharedObjectLock.withLock(for: self) {
        let oldValue = pairedNativeState
        pairedNativeState = newValue
        return oldValue
      }
      // The old native state can be deallocated here, so it is released after the lock is unlocked.
      withExtendedLifetime(oldValue) {}
    }
  }

  /// The storage of `nativeState`. Use it only under the lock.
  private var pairedNativeState: SharedObjectNativeState?

  /// Ends the pair with the native state: clears `nativeState` when it is the given native state. Another native state
  /// can be there already, when the object was paired again.
  internal func endPairing(with nativeState: SharedObjectNativeState) {
    let oldValue: SharedObjectNativeState? = SharedObjectLock.withLock(for: self) {
      guard pairedNativeState === nativeState else {
        return nil
      }
      let oldValue = pairedNativeState
      pairedNativeState = nil
      return oldValue
    }
    withExtendedLifetime(oldValue) {}
  }

  /**
   The default public initializer of the shared object.
   */
  public init() {}

  /// The value of `nativeRefType` on the JavaScript object, or `nil` when the object does not conform to
  /// `AnySharedRef`.
  internal var sharedRefType: String? {
    guard Self.conformsToAnySharedRef(Swift.type(of: self)) else {
      return nil
    }
    return (self as? AnySharedRef)?.nativeRefType
  }

  /// Whether each `SharedObject` class conforms to `AnySharedRef`. A failing `as? AnySharedRef` walks the
  /// whole class hierarchy on every call, so the result is looked up once per class.
  private static let anySharedRefConformances = Mutex([ObjectIdentifier: Bool]())

  private static func conformsToAnySharedRef(_ type: SharedObject.Type) -> Bool {
    let key = ObjectIdentifier(type)
    return anySharedRefConformances.withLock { conformances in
      if let conforms = conformances[key] {
        return conforms
      }
      let conforms = type is AnySharedRef.Type
      conformances[key] = conforms
      return conforms
    }
  }

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

  /// The native state, or `nil` if the object was released. A released native state can outlive the
  /// release on a JS object that couldn't drop it (for example a frozen one).
  internal var unreleasedNativeState: SharedObjectNativeState? {
    guard let nativeState, !nativeState.isReleased else {
      return nil
    }
    return nativeState
  }

  /// The JS object paired with this object in the given runtime, read off its native state. Returns
  /// `nil` when the object isn't paired in that runtime or was released.
  internal func object(in runtime: borrowing JavaScriptRuntime) -> JavaScriptObject? {
    return unreleasedNativeState?.javaScriptObject(in: runtime)
  }

  /// The reference that an event emitted now is dispatched through: the native state, or `nil` when the object isn't
  /// paired, and whether runtimes other than the main runtime have listeners. Both are read under one lock. The dispatch
  /// checks whether the object was released. See `EventEmitterReference`.
  @usableFromInline
  internal var eventEmitterReference: EventEmitterReference {
    return SharedObjectLock.withLock(for: self) {
      guard let nativeState = pairedNativeState else {
        return .sharedObject(nil)
      }
      // The native state of this object is behind the lock of this object too.
      if nativeState.hasListeningRuntimesUnderLock {
        return .sharedObjectInManyRuntimes(nativeState)
      }
      return .sharedObject(nativeState)
    }
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

  // MARK: - Macro-synthesized JSI hooks

  /// The name of the class in JavaScript. Overridden by the `@SharedObject` macro with the class name
  /// or the `@SharedObject("CustomName")` argument. A module registers the class through `_classTypes`.
  open class var _jsName: String {
    return unqualifiedTypeName(self)
  }

  /// Binds the class's `@JS` members onto its JavaScript prototype. Overridden by the `@SharedObject`
  /// macro; a `class func` (not a protocol requirement) so dispatch resolves per subclass.
  @JavaScriptActor
  open class func _decorateSharedObject(prototype: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {}

  /// Binds the class's `static` and `class` `@JS` members onto its JavaScript constructor. Overridden by
  /// the `@SharedObject` macro.
  @JavaScriptActor
  open class func _decorateSharedObject(constructor: borrowing JavaScriptObject, in runtime: JavaScriptRuntime) throws {}

  /// Builds a native instance from the JS constructor arguments, or `nil` to use the DSL `Constructor`
  /// path. Overridden by the `@SharedObject` macro from the class's `@JS init`.
  @JavaScriptActor
  open class func _constructSharedObject(this: borrowing JavaScriptValue, arguments: borrowing JavaScriptValuesBuffer, in runtime: JavaScriptRuntime) throws -> SharedObject? {
    return nil
  }
}

extension SharedObject: EventEmitter {
  @JavaScriptActor
  public func withEventTarget<R>(_ body: (borrowing JavaScriptObject) throws -> R) rethrows -> R? {
    // The same lookup as `getJavaScriptObject()`, without going through the registry, since it runs
    // for every emitted event.
    guard let runtime = try? appContext?.runtime, let target = object(in: runtime) else {
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
  /// Throws `NotFoundException` when the object carries no native state or its native object was released.
  @JavaScriptActor
  public static func native(from jsObject: borrowing JavaScriptObject) throws -> SharedObject {
    guard let nativeState = jsObject.getNativeState(as: SharedObjectNativeState.self), !nativeState.isReleased else {
      throw NotFoundException()
    }
    return nativeState.native
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

extension SharedObjectNativeState {
  /// Calls the listeners of the event in the given runtime with the payload, and the JS object in that runtime as
  /// `this`. Logs a warning when the native object was released or has no JS object in that runtime.
  @JavaScriptActor
  internal func dispatchEvent(event: String, payload: borrowing JavaScriptValue, in runtime: JavaScriptRuntime) {
    guard !isReleased else {
      warnEventTargetLost(event: event)
      return
    }
    // Only a JS object can add listeners, so without listeners there is nothing to look up.
    guard let eventListeners = listeners(in: runtime)?.listeners(of: event) else {
      return
    }
    guard let target = javaScriptObject(in: runtime) else {
      warnEventTargetLost(event: event)
      return
    }
    EventListeners.call(eventListeners, this: target, payload: payload, in: runtime)
  }
}

/// The locks of the `nativeState` property of shared objects, picked by the address of the object. A lock of its own
/// would cost an allocation for every shared object. A lock is never held while another one is taken, so two objects
/// that share a lock can't deadlock. The listening runtimes of a native state are behind the lock of its native object.
internal enum SharedObjectLock {
  private static let count = 64

  // The locks are never deallocated, and an `os_unfair_lock` is safe to use from any thread.
  private nonisolated(unsafe) static let locks: UnsafeMutablePointer<os_unfair_lock> = {
    let locks = UnsafeMutablePointer<os_unfair_lock>.allocate(capacity: count)
    locks.initialize(repeating: os_unfair_lock(), count: count)
    return locks
  }()

  static func withLock<R>(for object: SharedObject, _ body: () -> R) -> R {
    // Objects are aligned to 16 bytes, so the low bits of the address are always zero.
    let index = Int(truncatingIfNeeded: UInt(bitPattern: ObjectIdentifier(object)) >> 4) & (count - 1)
    let lock = locks + index
    os_unfair_lock_lock(lock)
    defer {
      os_unfair_lock_unlock(lock)
    }
    return body()
  }
}
