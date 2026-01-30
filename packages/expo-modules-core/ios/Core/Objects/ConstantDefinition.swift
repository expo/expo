// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesJSI

protocol AnyConstantDefinition {
  /**
   Name of the constant.
   */
  var name: String { get }

  /**
   Creates the JavaScript object representing the constant property descriptor.
   */
  @JavaScriptActor
  func buildDescriptor(appContext: AppContext) throws -> JavaScriptObject

  /**
   Returns the raw value of the constant for encoding purposes.
   */
  func getRawValue() -> Any?
}

public final class ConstantDefinition<ReturnType: AnyArgument>: AnyDefinition, AnyConstantDefinition {
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

  internal func getRawValue() -> Any? {
    return try? getter?()
  }

  /**
   Creates the JavaScript function that will be used as a getter of the constant.
   */
  @JavaScriptActor
  internal func buildGetter(appContext: AppContext) throws -> JavaScriptFunction {
    var savedValue: JavaScriptValue?
    return try appContext.runtime.createSyncFunction(name) { [weak appContext, weak self, name] _, _ in
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      guard let self else {
        throw NativeConstantUnavailableException(name)
      }
      guard let getter = self.getter else {
        throw NativeConstantWithoutGetterException(name)
      }
      if let value = savedValue?.copy() {
        return value
      }
      let value = try appContext.converter.toJS(try getter(), ~ReturnType.self)

      // Save a copy of the value, otherwise it would be implicitly consumed
      savedValue = value.copy()

      return value
    }
  }

  /**
   Creates the JavaScript object representing the constant property descriptor.
   */
  @JavaScriptActor
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

internal final class NativeConstantUnavailableException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    return "Native constant '\(param)' is no longer available in memory"
  }
}

internal final class NativeConstantWithoutGetterException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    return "Native constant '\(param)' doesn't have a getter"
  }
}
