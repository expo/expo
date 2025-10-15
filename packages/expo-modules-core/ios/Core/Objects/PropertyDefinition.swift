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

public struct PropertyDefinition<OwnerType>: AnyDefinition, AnyPropertyDefinition, Sendable {
  /**
   Name of the property.
   */
  let name: String

  /**
   Synchronous function that is called when the property is being accessed.
   */
  let getter: AnySyncFunctionDefinition?

  /**
   Synchronous function that is called when the property is being set.
   */
  let setter: AnySyncFunctionDefinition?

  /**
   Initializes a property definition without getter and setter functions.
   Make sure to call `.get` or `.set` modifiers, otherwise the property is no-op.
   */
  init(name: String) {
    self.name = name
    self.getter = nil
    self.setter = nil
  }

  /**
   The main initializer that initializes all stored properties.
   */
  private init(name: String, getter: AnySyncFunctionDefinition? = nil, setter: AnySyncFunctionDefinition? = nil) {
    self.name = name
    self.getter = getter
    self.setter = setter
  }

  /**
   Initializes a property definition with an optional getter and setter.
   */
  init<ReturnType>(
    name: String,
    get: (@Sendable (_ this: OwnerType) -> ReturnType)?,
    set: (@Sendable (_ this: OwnerType, _ newValue: ReturnType) -> Void)? = nil
  ) {
    var getter: AnySyncFunctionDefinition?
    var setter: AnySyncFunctionDefinition?

    if let get {
      getter = SyncFunctionDefinition(
        "get",
        firstArgType: OwnerType.self,
        dynamicArgumentTypes: [~OwnerType.self],
        returnType: ~ReturnType.self,
        get
      )
      getter?.takesOwner = true
    }
    if let set {
      setter = SyncFunctionDefinition(
        "set",
        firstArgType: OwnerType.self,
        dynamicArgumentTypes: [~OwnerType.self, ~ReturnType.self],
        returnType: ~Void.self,
        set
      )
      setter?.takesOwner = true
    }
    self.init(name: name, getter: getter, setter: setter)
  }

  // MARK: - Modifiers

  /**
   Modifier that sets property getter that has no arguments (the owner is not used).
   */
  @discardableResult
  public func get<ReturnType>(_ get: @Sendable @escaping () -> ReturnType) -> Self {
    let getter = SyncFunctionDefinition(
      "get",
      firstArgType: Void.self,
      dynamicArgumentTypes: [],
      returnType: ~ReturnType.self,
      get
    )
    return PropertyDefinition(name: name, getter: getter, setter: setter)
  }

  /**
   Modifier that sets property getter that receives the owner as an argument.
   */
  @discardableResult
  public func get<ReturnType>(_ get: @Sendable @escaping (_ this: OwnerType) -> ReturnType) -> Self {
    let getter = SyncFunctionDefinition(
      "get",
      firstArgType: OwnerType.self,
      dynamicArgumentTypes: [~OwnerType.self],
      returnType: ~ReturnType.self,
      get
    )
    getter.takesOwner = true
    return PropertyDefinition(name: name, getter: getter, setter: setter)
  }

  /**
   Modifier that sets property setter that receives only the new value as an argument.
   */
  @discardableResult
  public func set<ValueType>(_ set: @Sendable @escaping (_ newValue: ValueType) -> Void) -> Self {
    let setter = SyncFunctionDefinition(
      "set",
      firstArgType: ValueType.self,
      dynamicArgumentTypes: [~ValueType.self],
      returnType: ~Void.self,
      set
    )
    return PropertyDefinition(name: name, getter: getter, setter: setter)
  }

  /**
   Modifier that sets property setter that receives the owner and the new value as arguments.
   The owner is an object on which the function is called, like `this` in JavaScript.
   */
  @discardableResult
  public func set<ValueType>(_ set: @Sendable @escaping (_ this: OwnerType, _ newValue: ValueType) -> Void) -> Self {
    let setter = SyncFunctionDefinition(
      "set",
      firstArgType: OwnerType.self,
      dynamicArgumentTypes: [~OwnerType.self, ~ValueType.self],
      returnType: ~Void.self,
      set
    )
    setter.takesOwner = true
    return PropertyDefinition(name: name, getter: getter, setter: setter)
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
    return try appContext.runtime.createSyncFunction(name, argsCount: 0) { [weak appContext, getter] this, arguments in
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      guard let getter else {
        return .undefined
      }
      return try getter.call(appContext, withThis: this, arguments: arguments)
    }
  }

  /**
   Creates the JavaScript function that will be used as a setter of the property.
   */
  internal func buildSetter(appContext: AppContext) throws -> JavaScriptObject {
    return try appContext.runtime.createSyncFunction(name, argsCount: 1) { [weak appContext, setter] this, arguments in
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      guard let setter else {
        return .undefined
      }
      return try setter.call(appContext, withThis: this, arguments: arguments)
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
