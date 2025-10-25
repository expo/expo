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

public struct ConstantDefinition<ReturnType>: AnyDefinition, AnyConstantDefinition, Sendable {
  typealias ClosureType = @Sendable () throws -> ReturnType

  /**
   Name of the constant.
   */
  let name: String

  /**
   Synchronous function that is called when the property is being accessed.
   */
  let getter: ClosureType

  /**
   Initializes an unowned ConstantDefinition with a getter without arguments.
   */
  init(name: String, getter: @Sendable @escaping () -> ReturnType) {
    self.name = name
    self.getter = getter
  }

  // MARK: - Internals

  internal func getValue(appContext: AppContext) throws -> ReturnType? {
    return try getter()
  }

  /**
   Creates the JavaScript function that will be used as a getter of the constant.
   */
  internal func buildGetter(appContext: AppContext) throws -> JavaScriptObject {
    var prevValue: JavaScriptValue?
    return try appContext.runtime.createSyncFunction(name, argsCount: 0) { [weak appContext, getter] _, _ in
      if let prevValue {
        return prevValue
      }
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      let result = try getter()
      let newValue = try appContext.converter.toJS(result, ~ReturnType.self)
      prevValue = newValue
      return newValue
    }
  }

  /**
   Creates the JavaScript object representing the constant property descriptor.
   */
  internal func buildDescriptor(appContext: AppContext) throws -> JavaScriptObject {
    let descriptor = try appContext.runtime.createObject()

    descriptor.setProperty("enumerable", value: true)
    descriptor.setProperty("get", value: try buildGetter(appContext: appContext))

    return descriptor
  }
}
