/**
 Concurrently-executing asynchronous function without arguments.
 */
public func AsyncFunction<R>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping () async throws -> R
) -> ConcurrentFunctionDefinition<(), Void, R> {
  return ConcurrentFunctionDefinition(
    name,
    firstArgType: Void.self,
    dynamicArgumentTypes: [],
    closure
  )
}

/**
 Concurrently-executing asynchronous function with one or more arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, each A: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, repeat each A) async throws -> R
) -> ConcurrentFunctionDefinition<(A0, repeat each A), A0, R> {
  return ConcurrentFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: buildDynamicTypes(A0.self, repeat (each A).self),
    closure
  )
}
