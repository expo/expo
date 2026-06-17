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
