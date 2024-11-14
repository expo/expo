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
 Synchronous function with one argument.
 */
public func Function<R, A0: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0) throws -> R
) -> SyncFunctionDefinition<(A0), A0, R> {
  return SyncFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [~A0.self],
    returnType: ~R.self,
    closure
  )
}

/**
 Synchronous function with two arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1) throws -> R
) -> SyncFunctionDefinition<(A0, A1), A0, R> {
  return SyncFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [~A0.self, ~A1.self],
    returnType: ~R.self,
    closure
  )
}

/**
 Synchronous function with three arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2) throws -> R
) -> SyncFunctionDefinition<(A0, A1, A2), A0, R> {
  return SyncFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self
    ],
    returnType: ~R.self,
    closure
  )
}

/**
 Synchronous function with four arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3) throws -> R
) -> SyncFunctionDefinition<(A0, A1, A2, A3), A0, R> {
  return SyncFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self
    ],
    returnType: ~R.self,
    closure
  )
}

/**
 Synchronous function with five arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4) throws -> R
) -> SyncFunctionDefinition<(A0, A1, A2, A3, A4), A0, R> {
  return SyncFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self,
      ~A4.self
    ],
    returnType: ~R.self,
    closure
  )
}

/**
 Synchronous function with six arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4, A5) throws -> R
) -> SyncFunctionDefinition<(A0, A1, A2, A3, A4, A5), A0, R> {
  return SyncFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self,
      ~A4.self,
      ~A5.self
    ],
    returnType: ~R.self,
    closure
  )
}

/**
 Synchronous function with seven arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6) throws -> R
) -> SyncFunctionDefinition<(A0, A1, A2, A3, A4, A5, A6), A0, R> {
  return SyncFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self,
      ~A4.self,
      ~A5.self,
      ~A6.self
    ],
    returnType: ~R.self,
    closure
  )
}

/**
 Synchronous function with eight arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument, A7: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6, A7) throws -> R
) -> SyncFunctionDefinition<(A0, A1, A2, A3, A4, A5, A6, A7), A0, R> {
  return SyncFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self,
      ~A4.self,
      ~A5.self,
      ~A6.self,
      ~A7.self
    ],
    returnType: ~R.self,
    closure
  )
}
