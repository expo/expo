/**
 Asynchronous function without arguments.
 */
public func AsyncFunction<R>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping () throws -> R
) -> AsyncFunctionDefinition<(), Void, R> {
  return AsyncFunctionDefinition(
    name,
    firstArgType: Void.self,
    dynamicArgumentTypes: [],
    closure
  )
}

/**
 Asynchronous function with one or more arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, each A: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, repeat each A) throws -> R
) -> AsyncFunctionDefinition<(A0, repeat each A), A0, R> {
  return AsyncFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: buildDynamicTypes(A0.self, repeat (each A).self),
    closure
  )
}

func buildDynamicTypes<A0: AnyArgument, each A: AnyArgument>(
  _ first: A0.Type,
  _ rest: repeat (each A).Type
) -> [AnyDynamicType] {
  var result: [AnyDynamicType] = [~first]
  for type in repeat each rest {
    result.append(~type)
  }
  return result
}
