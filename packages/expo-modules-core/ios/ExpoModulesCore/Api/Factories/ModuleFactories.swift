/**
 Sets the name of the module that is exported to the JavaScript world.
 */
public func Name(_ name: String) -> AnyDefinition {
  return ModuleNameDefinition(name: name)
}
