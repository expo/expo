
/**
 A protocol that must be implemented to be a part of module's definition and the module definition itself.
 */
public protocol AnyDefinition {}

/**
 The definition of the module. It is used to define some parameters
 of the module and what it exports to the JavaScript world.
 See `ModuleDefinitionBuilder` for more details on how to create it.
 */
public struct ModuleDefinition: AnyDefinition {
  let name: String?
  let methods: [String : AnyMethod]
  let constants: [String : Any?]
  let eventListeners: [EventListener]
  let viewManager: ViewManagerDefinition?

  init(definitions: [AnyDefinition]) {
    self.name = definitions
      .compactMap { $0 as? ModuleNameDefinition }
      .last?
      .name

    self.methods = definitions
      .compactMap { $0 as? AnyMethod }
      .reduce(into: [String : AnyMethod]()) { dict, method in
        dict[method.name] = method
      }

    self.constants = definitions
      .compactMap { $0 as? ConstantsDefinition }
      .reduce(into: [String : Any?]()) { dict, definition in
        dict.merge(definition.constants) { $1 }
      }

    self.eventListeners = definitions.compactMap { $0 as? EventListener }

    self.viewManager = definitions
      .compactMap { $0 as? ViewManagerDefinition }
      .last
  }
}

/**
 Module's name definition. Returned by `name()` in module's definition.
 */
internal struct ModuleNameDefinition: AnyDefinition {
  let name: String
}

/**
 A definition for module's constants. Returned by `constants(() -> SomeType)` in module's definition.
 */
internal struct ConstantsDefinition: AnyDefinition {
  let constants: [String : Any?]
}
