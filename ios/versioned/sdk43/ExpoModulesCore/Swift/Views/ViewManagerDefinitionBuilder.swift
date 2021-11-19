
#if swift(>=5.4)
/**
 A result builder that captures scoped definitions specific for view managers, such as `ViewFactory` and `ConcreteViewProp`.
 */
@resultBuilder
public struct ViewManagerDefinitionBuilder {
  public static func buildBlock(_ definitions: AnyDefinition...) -> ViewManagerDefinition {
    return ViewManagerDefinition(definitions: definitions)
  }
}
#endif
