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

  /// Returns definitions synthesized from `@JS`-annotated members by the `@ExpoModule` macro.
  /// Framework-internal: the leading underscore signals this is not part of the public API and
  /// should only be called by `expo-modules-core` itself. Modules that don't use the macro fall
  /// back to the default empty implementation.
  func _exposedDefinition() -> [AnyDefinition]
}

public extension AnyModule {
  func _exposedDefinition() -> [AnyDefinition] {
    return []
  }
}
