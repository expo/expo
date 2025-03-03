// Copyright 2025-present 650 Industries. All rights reserved.

protocol AnyConstantDefinition {
  /**
   Name of the constant.
   */
  var name: String { get }

  /**
   Creates the JavaScript object representing the constant property descriptor.
   */
  func buildDescriptor(appContext: AppContext) throws -> JavaScriptObject
}

public final class ConstantDefinition<ReturnType>: AnyDefinition, AnyConstantDefinition {
  typealias ClosureType = () throws -> ReturnType

  /**
   Name of the constant.
   */
  let name: String

  /**
   Synchronous function that is called when the property is being accessed.
   */
  var getter: ClosureType?

  /**
   Initializes an unowned ConstantDefinition without a getter function.
   */
  init(name: String) {
    self.name = name
  }

  /**
   Initializes an unowned ConstantDefinition with a getter without arguments.
   */
  init(name: String, getter: @escaping () -> ReturnType) {
    self.name = name

    // Set the getter right away
    self.get(getter)
  }

  // MARK: - Modifiers

  /**
   Modifier that sets constant getter that has no arguments.
   */
  @discardableResult
  public func get(_ getter: @escaping () -> ReturnType) -> Self {
    self.getter = getter
    return self
  }

  // MARK: - Internals

  internal func getValue(appContext: AppContext) throws -> ReturnType? {
    return try getter?()
  }

  /**
   Creates the JavaScript function that will be used as a getter of the constant.
   */
  internal func buildGetter(appContext: AppContext) throws -> JavaScriptObject {
    var prevValue: JavaScriptValue?
    return try appContext.runtime.createSyncFunction(name, argsCount: 0) { [weak appContext, weak self, name] _, _ in
      guard let prevValue else {
        guard let appContext else {
          throw Exceptions.AppContextLost()
        }
        guard let self else {
          throw NativeConstantUnavailableException(name)
        }
        guard let getter = self.getter else {
          throw NativeConstantWithoutGetterException(name)
        }
        let result = try getter()
        let newValue = try appContext.converter.toJS(result, ~ReturnType.self)
        prevValue = newValue
        return newValue
      }
      return prevValue
    }
  }

  /**
   Creates the JavaScript object representing the constant property descriptor.
   */
  internal func buildDescriptor(appContext: AppContext) throws -> JavaScriptObject {
    let descriptor = try appContext.runtime.createObject()

    descriptor.setProperty("enumerable", value: true)

    if getter != nil {
      descriptor.setProperty("get", value: try buildGetter(appContext: appContext))
    }
    return descriptor
  }
}

// MARK: - Exceptions

internal final class NativeConstantUnavailableException: GenericException<String> {
  override var reason: String {
    return "Native constant '\(param)' is no longer available in memory"
  }
}

internal final class NativeConstantWithoutGetterException: GenericException<String> {
  override var reason: String {
    return "Native constant '\(param)' doesn't have a getter"
  }
}
