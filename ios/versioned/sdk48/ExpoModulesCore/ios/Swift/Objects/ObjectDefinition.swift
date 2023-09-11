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

  public func build(inRuntime runtime: JavaScriptRuntime) -> JavaScriptObject {
    let object = runtime.createObject()
    decorate(object: object, inRuntime: runtime)
    return object
  }

  public func decorate(object: JavaScriptObject, inRuntime runtime: JavaScriptRuntime) {
    decorateWithConstants(runtime: runtime, object: object)
    decorateWithFunctions(runtime: runtime, object: object)
    decorateWithProperties(runtime: runtime, object: object)
    decorateWithClasses(runtime: runtime, object: object)
  }

  // MARK: - Internals

  internal func decorateWithConstants(runtime: JavaScriptRuntime, object: JavaScriptObject) {
    for (key, value) in getConstants() {
      object.setProperty(key, value: value)
    }
  }

  internal func decorateWithFunctions(runtime: JavaScriptRuntime, object: JavaScriptObject) {
    for fn in functions.values {
      object.setProperty(fn.name, value: fn.build(inRuntime: runtime))
    }
  }

  internal func decorateWithProperties(runtime: JavaScriptRuntime, object: JavaScriptObject) {
    for property in properties.values {
      let descriptor = property.buildDescriptor(inRuntime: runtime)
      object.defineProperty(property.name, descriptor: descriptor)
    }
  }

  internal func decorateWithClasses(runtime: JavaScriptRuntime, object: JavaScriptObject) {
    for klass in classes.values {
      object.setProperty(klass.name, value: klass.build(inRuntime: runtime))
    }
  }
}
