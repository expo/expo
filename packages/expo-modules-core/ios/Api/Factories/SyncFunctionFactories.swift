/**
 Synchronous function from an optimized function descriptor.
 The descriptor is produced by `@OptimizedFunction` macro-generated peer functions.
 */
public func Function(
  _ name: String,
  _ descriptor: OptimizedFunctionDescriptor
) -> BaseOptimizedSyncFunctionDefinition {
  return BaseOptimizedSyncFunctionDefinition(
    name: name,
    typeEncoding: descriptor.typeEncoding,
    argsCount: descriptor.argsCount,
    block: descriptor.block
  )
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
