// Copyright 2022-present 650 Industries. All rights reserved.

import Dispatch

/**
 Type-erased protocol for asynchronous functions.
 */
public protocol AnyAsyncFunctionComponent: AnyFunction {
  /**
   Specifies on which queue the function should run.
   */
  func runOnQueue(_ queue: DispatchQueue?) -> Self
}

/**
 Represents a function that can only be called asynchronously, thus its JavaScript equivalent returns a Promise.
 */
internal final class AsyncFunctionComponent<Args, ReturnType>: AnyAsyncFunctionComponent {
  typealias ClosureType = (Args) throws -> ReturnType

  /**
   The underlying closure to run when the function is called.
   */
  let body: ClosureType

  /**
   Bool value indicating whether the function takes promise as the last argument.
   */
  let takesPromise: Bool

  /**
   Dispatch queue on which each function's call is run.
   */
  var queue: DispatchQueue?

  init(_ name: String, argTypes: [AnyArgumentType], _ body: @escaping ClosureType) {
    self.name = name
    self.takesPromise = argTypes.last is PromiseArgumentType
    self.body = body

    // Drop the last argument type if it's the `Promise`.
    self.argumentTypes = takesPromise ? argTypes.dropLast(1) : argTypes
  }

  // MARK: - AnyFunction

  let name: String

  let argumentTypes: [AnyArgumentType]

  var argumentsCount: Int {
    return argumentTypes.count
  }

  func call(args: [Any], callback: @escaping (FunctionCallResult) -> ()) {
    let promise = Promise { value in
      callback(.success(value as Any))
    } rejecter: { exception in
      callback(.failure(exception))
    }
    var arguments: [Any] = []

    do {
      arguments = try castArguments(args, toTypes: argumentTypes)
    } catch let error as Exception {
      callback(.failure(error))
      return
    } catch {
      callback(.failure(UnexpectedException(error)))
      return
    }

    // Add promise to the array of arguments if necessary.
    if takesPromise {
      arguments.append(promise)
    }

    let queue = queue ?? DispatchQueue.global(qos: .default)

    queue.async { [body, name] in
      let returnedValue: ReturnType?

      do {
        let argumentsTuple = try Conversions.toTuple(arguments) as! Args
        returnedValue = try body(argumentsTuple)
      } catch let error as Exception {
        promise.reject(FunctionCallException(name).causedBy(error))
        return
      } catch {
        promise.reject(UnexpectedException(error))
        return
      }
      if !self.takesPromise {
        promise.resolve(returnedValue)
      }
    }
  }

  // MARK: - AnyAsyncFunctionComponent

  public func runOnQueue(_ queue: DispatchQueue?) -> Self {
    self.queue = queue
    return self
  }
}

// MARK: - Factories

/**
 Asynchronous function without arguments.
 */
public func AsyncFunction<R>(
  _ name: String,
  _ closure: @escaping () throws -> R
) -> AnyAsyncFunctionComponent {
  return AsyncFunctionComponent(
    name,
    argTypes: [],
    closure
  )
}

/**
 Asynchronous function with one argument.
 */
public func AsyncFunction<R, A0: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0) throws -> R
) -> AnyAsyncFunctionComponent {
  return AsyncFunctionComponent(
    name,
    argTypes: [ArgumentType(A0.self)],
    closure
  )
}

/**
 Asynchronous function with two arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1) throws -> R
) -> AnyAsyncFunctionComponent {
  return AsyncFunctionComponent(
    name,
    argTypes: [ArgumentType(A0.self), ArgumentType(A1.self)],
    closure
  )
}

/**
 Asynchronous function with three arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2) throws -> R
) -> AnyAsyncFunctionComponent {
  return AsyncFunctionComponent(
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
 Asynchronous function with four arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3) throws -> R
) -> AnyAsyncFunctionComponent {
  return AsyncFunctionComponent(
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
 Asynchronous function with five arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4) throws -> R
) -> AnyAsyncFunctionComponent {
  return AsyncFunctionComponent(
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
 Asynchronous function with six arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4, A5) throws -> R
) -> AnyAsyncFunctionComponent {
  return AsyncFunctionComponent(
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
 Asynchronous function with seven arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6) throws -> R
) -> AnyAsyncFunctionComponent {
  return AsyncFunctionComponent(
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
 Asynchronous function with eight arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument, A7: AnyArgument>(
  _ name: String,
  _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6, A7) throws -> R
) -> AnyAsyncFunctionComponent {
  return AsyncFunctionComponent(
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
