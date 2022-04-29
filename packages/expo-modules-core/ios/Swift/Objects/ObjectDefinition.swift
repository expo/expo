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
    // Decorate with constants
    for (key, value) in getConstants() {
      object.setProperty(key, value: value)
    }

    // Decorate with functions
    for fn in functions.values {
      object.setProperty(fn.name, value: fn.build(inRuntime: runtime))
    }
  }
}
