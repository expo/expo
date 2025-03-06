// Copyright 2021-present 650 Industries. All rights reserved.

/**
 Base class for other definitions representing an object, such as `ModuleDefinition`.
 */
public class ObjectDefinition: AnyDefinition, JavaScriptObjectBuilder {
  /**
   A dictionary of functions defined by the object.
   */
  let functions: [String: AnyFunctionDefinition]

  /**
   An array of constants definitions.
   */
  let legacyConstants: [ConstantsDefinition]

  /**
   A map of constants defined by the object.
   */
  let constants: [String: AnyConstantDefinition]

  /**
   A map of dynamic properties defined by the object.
   */
  let properties: [String: AnyPropertyDefinition]

  /**
   A map of classes defined within the object.
   */
  let classes: [String: ClassDefinition]

  /**
   Default initializer receiving children definitions from the result builder.
   */
  init(definitions: [AnyDefinition]) {
    self.functions = definitions
      .compactMap { $0 as? AnyFunctionDefinition }
      .reduce(into: [String: AnyFunctionDefinition]()) { dict, function in
        dict[function.name] = function
      }

    self.legacyConstants = definitions
      .compactMap { $0 as? ConstantsDefinition }

    self.constants = definitions
      .compactMap { $0 as? AnyConstantDefinition }
      .reduce(into: [String: AnyConstantDefinition]()) { dict, constant in
        dict[constant.name] = constant
      }

    self.properties = definitions
      .compactMap { $0 as? AnyPropertyDefinition }
      .reduce(into: [String: AnyPropertyDefinition]()) { dict, property in
        dict[property.name] = property
      }

    self.classes = definitions
      .compactMap { $0 as? ClassDefinition }
      .reduce(into: [String: ClassDefinition]()) { dict, klass in
        dict[klass.name] = klass
      }
  }

  /**
   Merges all `constants` definitions into one dictionary.
   */
  func getLegacyConstants() -> [String: Any?] {
    return legacyConstants.reduce(into: [String: Any?]()) { dict, definition in
      dict.merge(definition.body()) { $1 }
    }
  }

  // MARK: - JavaScriptObjectBuilder

  public func build(appContext: AppContext) throws -> JavaScriptObject {
    let object = try appContext.runtime.createObject()
    try decorate(object: object, appContext: appContext)
    return object
  }

  public func decorate(object: JavaScriptObject, appContext: AppContext) throws {
    try decorateWithConstants(object: object, appContext: appContext)
    try decorateWithFunctions(object: object, appContext: appContext)
    try decorateWithProperties(object: object, appContext: appContext)
    try decorateWithClasses(object: object, appContext: appContext)
  }

  // MARK: - Internals

  internal func decorateWithConstants(object: JavaScriptObject, appContext: AppContext) throws {
    for (key, value) in getLegacyConstants() {
      object.setProperty(key, value: value)
    }

    for constant in constants.values {
      let descriptor = try constant.buildDescriptor(appContext: appContext)
      object.defineProperty(constant.name, descriptor: descriptor)
    }
  }

  internal func decorateWithFunctions(object: JavaScriptObject, appContext: AppContext) throws {
    for fn in functions.values {
      object.setProperty(fn.name, value: try fn.build(appContext: appContext))
    }
  }

  internal func decorateWithProperties(object: JavaScriptObject, appContext: AppContext) throws {
    for property in properties.values {
      let descriptor = try property.buildDescriptor(appContext: appContext)
      object.defineProperty(property.name, descriptor: descriptor)
    }
  }

  internal func decorateWithClasses(object: JavaScriptObject, appContext: AppContext) throws {
    for klass in classes.values {
      object.setProperty(klass.name, value: try klass.build(appContext: appContext))
    }
  }
}
