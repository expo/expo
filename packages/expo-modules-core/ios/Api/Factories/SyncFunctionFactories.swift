/**
 Helper function to fix type inference for optimized function definitions.
 This allows macro-generated classes to be properly typed as AnyDefinition.
 */
@inline(__always)
public func makeOptimized<T: AnyDefinition>(_ factory: () -> T) -> AnyDefinition {
  return factory()
}

/**
 Synchronous function without arguments.
 */
public func Function<R>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping () throws -> R
) -> SyncFunctionDefinition<(), Void, R> {
  return SyncFunctionDefinition(
    name,
    firstArgType: Void.self,
    dynamicArgumentTypes: [],
    returnType: ~R.self,
    closure
  )
}

/**
 Synchronous function with one or more arguments.
 */
public func Function<R, A0: AnyArgument, each A: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, repeat each A) throws -> R
) -> SyncFunctionDefinition<(A0, repeat each A), A0, R> {
  return SyncFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: buildDynamicTypes(A0.self, repeat (each A).self),
    returnType: ~R.self,
    closure
  )
}
