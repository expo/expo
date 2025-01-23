/**
 A function builder that provides DSL-like syntax. Thanks to this, the function doesn't need to explicitly return an array,
 but can just return multiple definitions one after another. This works similarly to SwiftUI's `body` block.
 */
@resultBuilder
public struct ModuleDefinitionBuilder {
  public static func buildBlock(_ definitions: AnyDefinition...) -> ModuleDefinition {
    return ModuleDefinition(definitions: definitions)
  }
  
  public static func buildOptional(_ component: ModuleDefinition?) -> ModuleDefinition {
    return component ?? ModuleDefinition(definitions: [])
  }
    
  public static func buildEither(first component: ModuleDefinition) -> ModuleDefinition {
    return component
  }
  
  public static func buildEither(second component: ModuleDefinition) -> ModuleDefinition {
    return component
  }
  
  public static func buildLimitedAvailability(_ component: ModuleDefinition) -> ModuleDefinition {
    return component
  }
}
