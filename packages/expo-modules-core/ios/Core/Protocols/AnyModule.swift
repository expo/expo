/**
 A protocol for any type-erased module that provides functions used by the core.
 */
public protocol AnyModule: AnyObject, AnyArgument {
  /**
   The default initializer. Must be public, but the module class does *not* need to
   define it as it is implemented in protocol composition, see `BaseModule` class.
   */
  init(appContext: AppContext)

  /**
   A DSL-like function that returns a `ModuleDefinition` which can be built up from module's name, constants or functions.
   The `@ModuleDefinitionBuilder` wrapper is *not* required in the implementation — it is implicitly inferred from the protocol.
   */
  @ModuleDefinitionBuilder
  func definition() -> ModuleDefinition
}
