// Copyright 2022-present 650 Industries. All rights reserved.

import Dispatch

/**
 Type-erased protocol for asynchronous functions.
 */
internal protocol AnyAsyncFunctionComponent: AnyFunction {
  /**
   Specifies on which queue the function should run.
   */
  func runOnQueue(_ queue: DispatchQueue?) -> Self
}

/**
 The default queue used for module's async function calls.
 */
private let defaultQueue = DispatchQueue(label: "expo.modules.AsyncFunctionQueue", qos: .userInitiated)

/**
 Represents a function that can only be called asynchronously, thus its JavaScript equivalent returns a Promise.
 */
public final class AsyncFunctionComponent<Args, FirstArgType, ReturnType>: AnyAsyncFunctionComponent {
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

  init(
    _ name: String,
    firstArgType: FirstArgType.Type,
    dynamicArgumentTypes: [AnyDynamicType],
    _ body: @escaping ClosureType
  ) {
    self.name = name
    self.takesPromise = dynamicArgumentTypes.last?.wraps(Promise.self) ?? false
    self.body = body

    // Drop the last argument type if it's the `Promise`.
    self.dynamicArgumentTypes = takesPromise ? dynamicArgumentTypes.dropLast(1) : dynamicArgumentTypes
  }

  // MARK: - AnyFunction

  let name: String

  let dynamicArgumentTypes: [AnyDynamicType]

  var argumentsCount: Int {
    return dynamicArgumentTypes.count - (takesOwner ? 1 : 0)
  }

  var takesOwner: Bool = false

  func call(by owner: AnyObject?, withArguments args: [Any], callback: @escaping (FunctionCallResult) -> ()) {
    let promise = Promise { value in
      callback(.success(Conversions.convertFunctionResult(value)))
    } rejecter: { exception in
      callback(.failure(exception))
    }
    var arguments: [Any] = []

    do {
      arguments = concat(
        arguments: try cast(arguments: args, forFunction: self),
        withOwner: owner,
        forFunction: self
      )
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

    let queue = queue ?? defaultQueue

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

  // MARK: - JavaScriptObjectBuilder

  func build(inRuntime runtime: JavaScriptRuntime) -> JavaScriptObject {
    return runtime.createAsyncFunction(name, argsCount: argumentsCount) { [weak self, name] this, args, resolve, reject in
      guard let self = self else {
        let exception = NativeFunctionUnavailableException(name)
        return reject(exception.code, exception.description, nil)
      }
      self.call(by: this, withArguments: args) { result in
        switch result {
        case .failure(let error):
          reject(error.code, error.description, nil)
        case .success(let value):
          resolve(value)
        }
      }
    }
  }

  // MARK: - AnyAsyncFunctionComponent

  public func runOnQueue(_ queue: DispatchQueue?) -> Self {
    self.queue = queue
    return self
  }
}

// MARK: - Exceptions

internal final class NativeFunctionUnavailableException: GenericException<String> {
  override var reason: String {
    return "Native function '\(param)' is no longer available in memory"
  }
}

// MARK: - Factories

/**
 Asynchronous function without arguments.
 */
public func AsyncFunction<R>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping () throws -> R
) -> AsyncFunctionComponent<(), Void, R> {
  return AsyncFunctionComponent(
    name,
    firstArgType: Void.self,
    dynamicArgumentTypes: [],
    closure
  )
}

/**
 Asynchronous function with one argument.
 */
public func AsyncFunction<R, A0: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0) throws -> R
) -> AsyncFunctionComponent<(A0), A0, R> {
  return AsyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [~A0.self],
    closure
  )
}

/**
 Asynchronous function with two arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1) throws -> R
) -> AsyncFunctionComponent<(A0, A1), A0, R> {
  return AsyncFunctionComponent(
    name,
    firstArgType: A0.self,
    dynamicArgumentTypes: [~A0.self, ~A1.self],
    closure
  )
}

/**
 Asynchronous function with three arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2) throws -> R
) -> AsyncFunctionComponent<(A0, A1, A2), A0, R> {
  return AsyncFunctionComponent(
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
 Asynchronous function with four arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3) throws -> R
) -> AsyncFunctionComponent<(A0, A1, A2, A3), A0, R> {
  return AsyncFunctionComponent(
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
 Asynchronous function with five arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4) throws -> R
) -> AsyncFunctionComponent<(A0, A1, A2, A3, A4), A0, R> {
  return AsyncFunctionComponent(
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
 Asynchronous function with six arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4, A5) throws -> R
) -> AsyncFunctionComponent<(A0, A1, A2, A3, A4, A5), A0, R> {
  return AsyncFunctionComponent(
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
 Asynchronous function with seven arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6) throws -> R
) -> AsyncFunctionComponent<(A0, A1, A2, A3, A4, A5, A6), A0, R> {
  return AsyncFunctionComponent(
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
 Asynchronous function with eight arguments.
 */
public func AsyncFunction<R, A0: AnyArgument, A1: AnyArgument, A2: AnyArgument, A3: AnyArgument, A4: AnyArgument, A5: AnyArgument, A6: AnyArgument, A7: AnyArgument>(
  _ name: String,
  @_implicitSelfCapture _ closure: @escaping (A0, A1, A2, A3, A4, A5, A6, A7) throws -> R
) -> AsyncFunctionComponent<(A0, A1, A2, A3, A4, A5, A6, A7), A0, R> {
  return AsyncFunctionComponent(
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
