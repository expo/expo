// Copyright 2025-present 650 Industries. All rights reserved.

internal import jsi

/**
 Represents a weak reference to an object. If the only references to an object are these,
 the object is eligible for GC. Method names are inspired by C++ `std::weak_ptr`.
 */
public struct JavaScriptWeakObject: JavaScriptType, ~Copyable {
  internal weak var runtime: JavaScriptRuntime?
  internal let pointee: facebook.jsi.WeakObject

  /**
   Initializes a weak object with the underlying JSI weak object.
   */
  internal/*!*/ init(_ runtime: JavaScriptRuntime, _ object: consuming facebook.jsi.WeakObject) {
    self.runtime = runtime
    self.pointee = object
  }

  /**
   Creates `JavaScriptWeakObject` from `JavaScriptObject`. Same as `createWeak()` called on the object.
   */
  public init(_ runtime: JavaScriptRuntime, _ object: borrowing JavaScriptObject) {
    self.runtime = runtime
    self.pointee = facebook.jsi.WeakObject(runtime.pointee, object.pointee)
  }

  /**
   Returns a Value representing the underlying Object if it is still valid; otherwise returns `undefined`.
   Note that this method has nothing to do with threads or concurrency. The name is based on `std::weak_ptr::lock()` which serves a similar purpose.
   */
  public func lock() -> JavaScriptValue {
    guard let runtime else {
      JS.runtimeLostFatalError()
    }
    return JavaScriptValue(runtime, pointee.lock(runtime.pointee))
  }

  public func asValue() -> JavaScriptValue {
    return lock().asValue()
  }
}
