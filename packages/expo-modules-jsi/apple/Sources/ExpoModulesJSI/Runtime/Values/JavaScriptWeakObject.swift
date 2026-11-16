// Copyright 2025-present 650 Industries. All rights reserved.

internal import jsi

/// Represents a weak reference to an object. If the only references to an object are these,
/// the object is eligible for GC. Method names are inspired by C++ `std::weak_ptr`.
public struct JavaScriptWeakObject: JavaScriptType, ~Copyable {
  /// Handle to the runtime the weak object belongs to.
  internal let runtimeHandle: JavaScriptRuntimeHandle

  /// The runtime the weak object belongs to, or `nil` if it has been deallocated. Prefer ``jsiRuntime`` on
  /// hot paths: it costs no reference counting.
  internal var runtime: JavaScriptRuntime? {
    return runtimeHandle.runtime
  }

  /// The engine runtime the weak object belongs to, or `nil` if the runtime has been deallocated.
  internal var jsiRuntime: facebook.jsi.IRuntime? {
    return runtimeHandle.pointee
  }
  internal let pointee: facebook.jsi.WeakObject

  /// Initializes a weak object with the underlying JSI weak object.
  internal init(_ runtime: JavaScriptRuntime, _ object: consuming facebook.jsi.WeakObject) {
    self.runtimeHandle = runtime.handle
    self.pointee = object
  }

  /// Creates `JavaScriptWeakObject` from `JavaScriptObject`. Same as `createWeak()` called on the object.
  public init(_ runtime: JavaScriptRuntime, _ object: borrowing JavaScriptObject) {
    self.runtimeHandle = runtime.handle
    self.pointee = facebook.jsi.WeakObject(runtime.pointee, object.pointee)
  }

  /// Returns the underlying `JavaScriptObject` if it is still valid; otherwise returns `nil`.
  /// Note that this method has nothing to do with threads or concurrency. The name is based on `std::weak_ptr::lock()` which serves a similar purpose.
  public func lock() -> JavaScriptObject? {
    guard let jsiRuntime else {
      FatalError.runtimeLost()
    }
    let jsiValue = pointee.lock(jsiRuntime)
    return jsiValue.isObject() ? JavaScriptObject(runtimeHandle, jsiValue.getObject(jsiRuntime)) : nil
  }

  public func asValue() -> JavaScriptValue {
    return lock()?.asValue() ?? .undefined()
  }
}
