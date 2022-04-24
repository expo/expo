// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Represents a function that can only be called synchronously.
 - ToDo: Move some synchronous logic from `ConcreteFunction` (like `call(args:)`) to this class and drop the `isAsync` property.
 */
internal final class SyncFunctionComponent<Args, ReturnType>: ConcreteFunction<Args, ReturnType> {
  override init(
    _ name: String,
    argTypes: [AnyArgumentType],
    _ closure: @escaping ConcreteFunction<Args, ReturnType>.ClosureType
  ) {
    super.init(name, argTypes: argTypes, closure)
    self.isAsync = false
  }
}

/**
 Synchronous function without arguments.
 */
public func Function<R>(
  _ name: String,
  _ closure: @escaping () throws -> R
) -> AnyFunction {
  return SyncFunctionComponent(
    name,
    argTypes: [],
    closure
  )
}

/**
 Synchronous function with one argument.
 */
public func Function<R, A0: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0) throws -> R
) -> AnyFunction {
  return SyncFunctionComponent(
    name,
    argTypes: [ArgumentType(A0.self)],
    closure
  )
}

/**
 Synchronous function with two arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1) throws -> R
) -> AnyFunction {
  return SyncFunctionComponent(
    name,
    argTypes: [ArgumentType(A0.self), ArgumentType(A1.self)],
    closure
  )
}

/**
 Synchronous function with three arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2) throws -> R
) -> AnyFunction {
  return SyncFunctionComponent(
    name,
    argTypes: [
      ArgumentType(A0.self),
      ArgumentType(A1.self),
      ArgumentType(A2.self)
    ],
    closure
  )
}

/**
 Synchronous function with four arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3) throws -> R
) -> AnyFunction {
  return SyncFunctionComponent(
    name,
    argTypes: [
      ArgumentType(A0.self),
      ArgumentType(A1.self),
      ArgumentType(A2.self),
      ArgumentType(A3.self)
    ],
    closure
  )
}

/**
 Synchronous function with five arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4) throws -> R
) -> AnyFunction {
  return SyncFunctionComponent(
    name,
    argTypes: [
      ArgumentType(A0.self),
      ArgumentType(A1.self),
      ArgumentType(A2.self),
      ArgumentType(A3.self),
      ArgumentType(A4.self)
    ],
    closure
  )
}

/**
 Synchronous function with six arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4, A5) throws -> R
) -> AnyFunction {
  return SyncFunctionComponent(
    name,
    argTypes: [
      ArgumentType(A0.self),
      ArgumentType(A1.self),
      ArgumentType(A2.self),
      ArgumentType(A3.self),
      ArgumentType(A4.self),
      ArgumentType(A5.self)
    ],
    closure
  )
}

/**
 Synchronous function with seven arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6) throws -> R
) -> AnyFunction {
  return SyncFunctionComponent(
    name,
    argTypes: [
      ArgumentType(A0.self),
      ArgumentType(A1.self),
      ArgumentType(A2.self),
      ArgumentType(A3.self),
      ArgumentType(A4.self),
      ArgumentType(A5.self),
      ArgumentType(A6.self)
    ],
    closure
  )
}

/**
 Synchronous function with eight arguments.
 */
public func Function<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument, A7: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6, A7) throws -> R
) -> AnyFunction {
  return SyncFunctionComponent(
    name,
    argTypes: [
      ArgumentType(A0.self),
      ArgumentType(A1.self),
      ArgumentType(A2.self),
      ArgumentType(A3.self),
      ArgumentType(A4.self),
      ArgumentType(A5.self),
      ArgumentType(A6.self),
      ArgumentType(A7.self)
    ],
    closure
  )
}
