// Copyright 2022-present 650 Industries. All rights reserved.

public final class PropertyComponent: AnyDefinition {
  /**
   Name of the property.
   */
  let name: String

  /**
   Synchronous function that is called when the property is being accessed.
   */
  var getter: AnySyncFunctionComponent?

  /**
   Synchronous function that is called when the property is being set.
   */
  var setter: AnySyncFunctionComponent?

  init(name: String) {
    self.name = name
  }

  // MARK: - Modifiers

  /**
   Modifier that sets property getter that has no arguments (the caller is not used).
   */
  public func get<Value>(_ getter: @escaping () -> Value) -> Self {
    self.getter = SyncFunctionComponent(
      "get",
      firstArgType: Void.self,
      dynamicArgumentTypes: [~Any.self],
      { (caller: Any) in getter() }
    )
    return self
  }

  /**
   Modifier that sets property setter that receives only the new value as an argument.
   */
  public func set<Value>(_ setter: @escaping (_ newValue: Value) -> ()) -> Self {
    self.setter = SyncFunctionComponent(
      "set",
      firstArgType: Void.self,
      dynamicArgumentTypes: [~Any.self, ~Value.self],
      { (caller: Any, value: Value) in setter(value) }
    )
    return self
  }

  /**
   Modifier that sets property getter that receives the caller as an argument.
   The caller is an object on which the function is called, like `this` in JavaScript.
   */
  public func get<Value, Caller>(_ getter: @escaping (_ this: Caller) -> Value) -> Self {
    self.getter = SyncFunctionComponent(
      "get",
      firstArgType: Caller.self,
      dynamicArgumentTypes: [~Caller.self],
      getter
    )
    return self
  }

  /**
   Modifier that sets property setter that receives the caller and the new value as arguments.
   The caller is an object on which the function is called, like `this` in JavaScript.
   */
  public func set<Value, Caller>(_ setter: @escaping (_ this: Caller, _ newValue: Value) -> ()) -> Self {
    self.setter = SyncFunctionComponent(
      "set",
      firstArgType: Caller.self,
      dynamicArgumentTypes: [~Caller.self, ~Value.self],
      setter
    )
    return self
  }

  // MARK: - Internals

  internal func getValue<Value>(caller: AnyObject? = nil) -> Value? {
    let value = try? getter?.call(by: caller, withArguments: [caller as Any])
    return value as? Value
  }

  internal func setValue(_ value: Any, caller: AnyObject? = nil) {
    let _ = try? setter?.call(by: caller, withArguments: [caller as Any, value])
  }

  /**
   Creates the JavaScript function that will be used as a getter of the property.
   */
  internal func buildGetter(inRuntime runtime: JavaScriptRuntime, withCaller caller: AnyObject?) -> JavaScriptObject {
    return runtime.createSyncFunction(name, argsCount: 0) { [weak self, weak caller] this, args in
      return self?.getValue(caller: caller)
    }
  }

  /**
   Creates the JavaScript function that will be used as a setter of the property.
   */
  internal func buildSetter(inRuntime runtime: JavaScriptRuntime, withCaller caller: AnyObject?) -> JavaScriptObject {
    return runtime.createSyncFunction(name, argsCount: 1) { [weak self, weak caller] this, args in
      return self?.setValue(args.first as Any, caller: caller)
    }
  }

  /**
   Creates the JavaScript object representing the property descriptor.
   */
  internal func buildDescriptor(inRuntime runtime: JavaScriptRuntime, withCaller caller: AnyObject?) -> JavaScriptObject {
    let descriptor = runtime.createObject()

    descriptor.setProperty("enumerable", value: true)

    if getter != nil {
      descriptor.setProperty("get", value: buildGetter(inRuntime: runtime, withCaller: caller))
    }
    if setter != nil {
      descriptor.setProperty("set", value: buildSetter(inRuntime: runtime, withCaller: caller))
    }
    return descriptor
  }
}

// MARK: - Factory functions

/**
 Creates the property with given name. The component is basically no-op if you don't call `.get(_:)` or `.set(_:)` on it.
 */
public func Property(_ name: String) -> PropertyComponent {
  return PropertyComponent(name: name)
}

/**
 Creates the read-only property whose getter doesn't take the caller as an argument.
 */
public func Property<Value: AnyArgument>(_ name: String, @_implicitSelfCapture get: @escaping () -> Value) -> PropertyComponent {
  return PropertyComponent(name: name).get(get)
}

/**
 Creates the read-only property whose getter takes the caller as an argument.
 */
public func Property<Value: AnyArgument, Caller>(
  _ name: String,
  @_implicitSelfCapture get: @escaping (Caller) -> Value
) -> PropertyComponent {
  return PropertyComponent(name: name).get(get)
}
