// Copyright 2022-present 650 Industries. All rights reserved.

protocol AnyPropertyComponent {
  /**
   Name of the property.
   */
  var name: String { get }

  /**
   Creates the JavaScript object representing the property descriptor.
   */
  func buildDescriptor(inRuntime runtime: JavaScriptRuntime) -> JavaScriptObject
}

public final class PropertyComponent<OwnerType>: AnyDefinition, AnyPropertyComponent {
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

  /**
   Initializes an unowned PropertyComponent without getter and setter functions.
   */
  init(name: String) {
    self.name = name
  }

  /**
   Initializes an unowned PropertyComponent with a getter without arguments.
   */
  init<ReturnType>(name: String, getter: @escaping () -> ReturnType) {
    self.name = name

    // Set the getter right away
    self.get(getter)
  }

  /**
   Initializes an owned PropertyComponent with a getter that takes the owner as its first argument.
   */
  init<ReturnType>(name: String, getter: @escaping (_ this: OwnerType) -> ReturnType) {
    self.name = name

    // Set the getter right away
    self.get(getter)
  }

  // MARK: - Modifiers

  /**
   Modifier that sets property getter that has no arguments (the owner is not used).
   */
  @discardableResult
  public func get<ReturnType>(_ getter: @escaping () -> ReturnType) -> Self {
    self.getter = SyncFunctionComponent(
      "get",
      firstArgType: Void.self,
      dynamicArgumentTypes: [],
      getter
    )
    return self
  }

  /**
   Modifier that sets property getter that receives the owner as an argument.
   The owner is an object on which the function is called, like `this` in JavaScript.
   */
  @discardableResult
  public func get<ReturnType>(_ getter: @escaping (_ this: OwnerType) -> ReturnType) -> Self {
    self.getter = SyncFunctionComponent(
      "get",
      firstArgType: OwnerType.self,
      dynamicArgumentTypes: [~OwnerType.self],
      getter
    )
    self.getter?.takesOwner = true
    return self
  }

  /**
   Modifier that sets property setter that receives only the new value as an argument.
   */
  @discardableResult
  public func set<ValueType>(_ setter: @escaping (_ newValue: ValueType) -> Void) -> Self {
    self.setter = SyncFunctionComponent(
      "set",
      firstArgType: ValueType.self,
      dynamicArgumentTypes: [~ValueType.self],
      setter
    )
    return self
  }

  /**
   Modifier that sets property setter that receives the owner and the new value as arguments.
   The owner is an object on which the function is called, like `this` in JavaScript.
   */
  @discardableResult
  public func set<ValueType>(_ setter: @escaping (_ this: OwnerType, _ newValue: ValueType) -> Void) -> Self {
    self.setter = SyncFunctionComponent(
      "set",
      firstArgType: OwnerType.self,
      dynamicArgumentTypes: [~OwnerType.self, ~ValueType.self],
      setter
    )
    self.setter?.takesOwner = true
    return self
  }

  // MARK: - Internals

  internal func getValue<ValueType>(owner: OwnerType? = nil) throws -> ValueType? {
    let owner = owner as? AnyObject
    let value = try getter?.call(by: owner, withArguments: [])
    return value as? ValueType
  }

  internal func setValue(_ value: Any, owner: OwnerType? = nil) {
    let owner = owner as? AnyObject
    _ = try? setter?.call(by: owner, withArguments: [value])
  }

  /**
   Creates the JavaScript function that will be used as a getter of the property.
   */
  internal func buildGetter(inRuntime runtime: JavaScriptRuntime) -> JavaScriptObject {
    return runtime.createSyncFunction(name, argsCount: 0) { [weak self, name] this, args in
      guard let self = self else {
        throw NativePropertyUnavailableException(name)
      }
      guard let getter = self.getter else {
        return
      }
      return try getter.call(by: this, withArguments: args)
    }
  }

  /**
   Creates the JavaScript function that will be used as a setter of the property.
   */
  internal func buildSetter(inRuntime runtime: JavaScriptRuntime) -> JavaScriptObject {
    return runtime.createSyncFunction(name, argsCount: 1) { [weak self, name] this, args in
      guard let self = self else {
        throw NativePropertyUnavailableException(name)
      }
      guard let setter = self.setter else {
        return
      }
      return try setter.call(by: this, withArguments: args)
    }
  }

  /**
   Creates the JavaScript object representing the property descriptor.
   */
  internal func buildDescriptor(inRuntime runtime: JavaScriptRuntime) -> JavaScriptObject {
    let descriptor = runtime.createObject()

    descriptor.setProperty("enumerable", value: true)

    if getter != nil {
      descriptor.setProperty("get", value: buildGetter(inRuntime: runtime))
    }
    if setter != nil {
      descriptor.setProperty("set", value: buildSetter(inRuntime: runtime))
    }
    return descriptor
  }
}

// MARK: - Exceptions

internal final class NativePropertyUnavailableException: GenericException<String> {
  override var reason: String {
    return "Native property '\(param)' is no longer available in memory"
  }
}

// MARK: - Factory functions

/**
 Creates the property with given name. The component is basically no-op if you don't call `.get(_:)` or `.set(_:)` on it.
 */
public func Property(_ name: String) -> PropertyComponent<Void> {
  return PropertyComponent(name: name)
}

/**
 Creates the read-only property whose getter doesn't take the owner as an argument.
 */
public func Property<Value: AnyArgument>(_ name: String, @_implicitSelfCapture get: @escaping () -> Value) -> PropertyComponent<Void> {
  return PropertyComponent(name: name, getter: get)
}

/**
 Creates the read-only property whose getter takes the owner as an argument.
 */
public func Property<Value: AnyArgument, OwnerType>(
  _ name: String,
  @_implicitSelfCapture get: @escaping (_ this: OwnerType) -> Value
) -> PropertyComponent<OwnerType> {
  return PropertyComponent<OwnerType>(name: name, getter: get)
}

/**
 Creates the property that references to an immutable property of the owner object using the key path.
 */
public func Property<Value: AnyArgument, OwnerType>(
  _ name: String,
  _ keyPath: KeyPath<OwnerType, Value>
) -> PropertyComponent<OwnerType> {
  return PropertyComponent<OwnerType>(name: name) { owner in
    return owner[keyPath: keyPath]
  }
}

/**
 Creates the property that references to a mutable property of the owner object using the key path.
 */
public func Property<Value: AnyArgument, OwnerType>(
  _ name: String,
  _ keyPath: ReferenceWritableKeyPath<OwnerType, Value>
) -> PropertyComponent<OwnerType> {
  return PropertyComponent<OwnerType>(name: name) { owner in
    return owner[keyPath: keyPath]
  }
  .set { owner, newValue in
    owner[keyPath: keyPath] = newValue
  }
}
