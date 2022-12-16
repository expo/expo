// Copyright 2021-present 650 Industries. All rights reserved.

/**
 Base class for other definitions representing an object, such as `ModuleDefinition`.
 */
public class ObjectDefinition: AnyDefinition {
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
}
