// Copyright 2021-present 650 Industries. All rights reserved.

/**
 Base class for other definitions representing an object, such as `ModuleDefinition`.
 */
public class ObjectDefinition: AnyDefinition, JavaScriptObjectBuilder {
  /**
   A dictionary of functions defined by the object.
   */
  let functions: [String: AnyFunction]

  /**
   An array of constants definitions.
   */
  let constants: [ConstantsDefinition]

  /**
   A map of dynamic properties defined by the object.
   */
  let properties: [String: AnyPropertyComponent]

  /**
   A map of classes defined within the object.
   */
  let classes: [String: ClassComponent]

  /**
   Default initializer receiving children definitions from the result builder.
   */
  init(definitions: [AnyDefinition]) {
    self.functions = definitions
      .compactMap { $0 as? AnyFunction }
      .reduce(into: [String: AnyFunction]()) { dict, function in
        dict[function.name] = function
      }

    self.constants = definitions
      .compactMap { $0 as? ConstantsDefinition }

    self.properties = definitions
      .compactMap { $0 as? AnyPropertyComponent }
      .reduce(into: [String: AnyPropertyComponent]()) { dict, property in
        dict[property.name] = property
      }

    self.classes = definitions
      .compactMap { $0 as? ClassComponent }
      .reduce(into: [String: ClassComponent]()) { dict, klass in
        dict[klass.name] = klass
      }
  }

  /**
   Merges all `constants` definitions into one dictionary.
   */
  func getConstants() -> [String: Any?] {
    return constants.reduce(into: [String: Any?]()) { dict, definition in
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
    let runtime = try appContext.runtime

    decorateWithConstants(object: object)
    try decorateWithFunctions(object: object, appContext: appContext)
    try decorateWithProperties(object: object, appContext: appContext)
    try decorateWithClasses(object: object, appContext: appContext)
  }

  // MARK: - Internals

  internal func decorateWithConstants(object: JavaScriptObject) {
    for (key, value) in getConstants() {
      object.setProperty(key, value: value)
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
