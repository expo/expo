// Copyright 2022-present 650 Industries. All rights reserved.

protocol AnyPropertyDefinition {
  /**
   Name of the property.
   */
  var name: String { get }

  /**
   Creates the JavaScript object representing the property descriptor.
   */
  func buildDescriptor(appContext: AppContext) throws -> JavaScriptObject
}

public final class PropertyDefinition<OwnerType>: AnyDefinition, AnyPropertyDefinition {
  /**
   Name of the property.
   */
  let name: String

  /**
   Synchronous function that is called when the property is being accessed.
   */
  var getter: AnySyncFunctionDefinition?

  /**
   Synchronous function that is called when the property is being set.
   */
  var setter: AnySyncFunctionDefinition?

  /**
   Initializes an unowned PropertyDefinition without getter and setter functions.
   */
  init(name: String) {
    self.name = name
  }

  /**
   Initializes an unowned PropertyDefinition with a getter without arguments.
   */
  init<ReturnType>(name: String, getter: @escaping () -> ReturnType) {
    self.name = name

    // Set the getter right away
    self.get(getter)
  }

  /**
   Initializes an owned PropertyDefinition with a getter that takes the owner as its first argument.
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
    self.getter = SyncFunctionDefinition(
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
    self.getter = SyncFunctionDefinition(
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
    self.setter = SyncFunctionDefinition(
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
    self.setter = SyncFunctionDefinition(
      "set",
      firstArgType: OwnerType.self,
      dynamicArgumentTypes: [~OwnerType.self, ~ValueType.self],
      setter
    )
    self.setter?.takesOwner = true
    return self
  }

  // MARK: - Internals

  internal func getValue<ValueType>(owner: OwnerType? = nil, appContext: AppContext) throws -> ValueType? {
    let owner = owner as? AnyObject
    let value = try getter?.call(by: owner, withArguments: [], appContext: appContext)
    return value as? ValueType
  }

  internal func setValue(_ value: Any, owner: OwnerType? = nil, appContext: AppContext) {
    let owner = owner as? AnyObject
    _ = try? setter?.call(by: owner, withArguments: [value], appContext: appContext)
  }

  /**
   Creates the JavaScript function that will be used as a getter of the property.
   */
  internal func buildGetter(appContext: AppContext) throws -> JavaScriptObject {
    return try appContext.runtime.createSyncFunction(name, argsCount: 0) { [weak appContext, weak self, name] this, args in
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      guard let self else {
        throw NativePropertyUnavailableException(name)
      }
      guard let getter = self.getter else {
        return
      }
      return try getter.call(by: this, withArguments: args, appContext: appContext)
    }
  }

  /**
   Creates the JavaScript function that will be used as a setter of the property.
   */
  internal func buildSetter(appContext: AppContext) throws -> JavaScriptObject {
    return try appContext.runtime.createSyncFunction(name, argsCount: 1) { [weak appContext, weak self, name] this, args in
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      guard let self else {
        throw NativePropertyUnavailableException(name)
      }
      guard let setter = self.setter else {
        return
      }
      return try setter.call(by: this, withArguments: args, appContext: appContext)
    }
  }

  /**
   Creates the JavaScript object representing the property descriptor.
   */
  internal func buildDescriptor(appContext: AppContext) throws -> JavaScriptObject {
    let descriptor = try appContext.runtime.createObject()

    descriptor.setProperty("enumerable", value: true)

    if getter != nil {
      descriptor.setProperty("get", value: try buildGetter(appContext: appContext))
    }
    if setter != nil {
      descriptor.setProperty("set", value: try buildSetter(appContext: appContext))
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
