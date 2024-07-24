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
 Concurrently-executing asynchronous function with one argument.
 */
public func AsyncFunction<R, A0: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0) async throws -> R
) -> ConcurrentFunctionDefinition<(A0), A0, R> {
  return ConcurrentFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [~A0.self],
    closure
  )
}

/**
 Concurrently-executing asynchronous function with two arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1) async throws -> R
) -> ConcurrentFunctionDefinition<(A0, A1), A0, R> {
  return ConcurrentFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [~A0.self, ~A1.self],
    closure
  )
}

/**
 Concurrently-executing asynchronous function with three arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2) async throws -> R
) -> ConcurrentFunctionDefinition<(A0, A1, A2), A0, R> {
  return ConcurrentFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self
    ],
    closure
  )
}

/**
 Concurrently-executing asynchronous function with four arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3) async throws -> R
) -> ConcurrentFunctionDefinition<(A0, A1, A2, A3), A0, R> {
  return ConcurrentFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self
    ],
    closure
  )
}

/**
 Concurrently-executing asynchronous function with five arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4) async throws -> R
) -> ConcurrentFunctionDefinition<(A0, A1, A2, A3, A4), A0, R> {
  return ConcurrentFunctionDefinition(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [
      ~A0.self,
      ~A1.self,
      ~A2.self,
      ~A3.self,
      ~A4.self
    ],
    closure
  )
}

/**
 Concurrently-executing asynchronous function with six arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4, A5) async throws -> R
) -> ConcurrentFunctionDefinition<(A0, A1, A2, A3, A4, A5), A0, R> {
  return ConcurrentFunctionDefinition(
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
    closure
  )
}

/**
 Concurrently-executing asynchronous function with seven arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6) async throws -> R
) -> ConcurrentFunctionDefinition<(A0, A1, A2, A3, A4, A5, A6), A0, R> {
  return ConcurrentFunctionDefinition(
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
    closure
  )
}

/**
 Concurrently-executing asynchronous function with eight arguments.
 */
public func AsyncFunction<
  R,
  A0: AnyArgument,
  A1: AnyArgument,
  A2: AnyArgument,
  A3: AnyArgument,
  A4: AnyArgument,
  A5: AnyArgument,
  A6: AnyArgument,
  A7: AnyArgument
>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6, A7) async throws -> R
) -> ConcurrentFunctionDefinition<(A0, A1, A2, A3, A4, A5, A6, A7), A0, R> {
  return ConcurrentFunctionDefinition(
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
    closure
  )
}
