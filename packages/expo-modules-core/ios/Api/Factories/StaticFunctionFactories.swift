/**
 Static synchronous function without arguments.
 */
public func StaticFunction<R>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping () throws -> R
) -> StaticSyncFunctionDefinition<(), Void, R> {
  return StaticSyncFunctionDefinition(
    name,
    firstArgType: Void.self,
    dynamicArgumentTypes: [],
    returnType: ~R.self,
    closure
  )
}

/**
 Static synchronous function with one or more arguments.
 */
public func StaticFunction<R, A0: AnyArgument, each A: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, repeat each A) throws -> R
) -> StaticSyncFunctionDefinition<(A0, repeat each A), A0, R> {
  return StaticSyncFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: buildDynamicTypes(A0.self, repeat (each A).self),
    returnType: ~R.self,
    closure
  )
}

/**
 Static asynchronous function without arguments.
 */
public func StaticAsyncFunction<R>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping () throws -> R
) -> StaticAsyncFunctionDefinition<(), Void, R> {
  return StaticAsyncFunctionDefinition(
    name,
    firstArgType: Void.self,
    dynamicArgumentTypes: [],
    closure
  )
}

/**
 Static asynchronous function with one or more arguments.
 */
public func StaticAsyncFunction<R, A0: AnyArgument, each A: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, repeat each A) throws -> R
) -> StaticAsyncFunctionDefinition<(A0, repeat each A), A0, R> {
  return StaticAsyncFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: buildDynamicTypes(A0.self, repeat (each A).self),
    closure
  )
}
