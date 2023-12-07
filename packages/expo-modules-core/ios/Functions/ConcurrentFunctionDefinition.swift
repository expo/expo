// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Represents a concurrent function that can only be called asynchronously, thus its JavaScript equivalent returns a Promise.
 As opposed to `AsyncFunctionComponent`, it can leverage the new Swift's concurrency model and take the async/await closure.
 */
public final class ConcurrentFunctionDefinition<Args, FirstArgType, ReturnType>: AnyFunction {
  typealias ClosureType = (Args) async throws -> ReturnType

  let body: ClosureType

  init(
    _ name: String,
    firstArgType: FirstArgType.Type,
    dynamicArgumentTypes: [AnyDynamicType],
    _ body: @escaping ClosureType
  ) {
    self.name = name
    self.body = body
    self.dynamicArgumentTypes = dynamicArgumentTypes
  }

  // MARK: - AnyFunction

  let name: String

  let dynamicArgumentTypes: [AnyDynamicType]

  var argumentsCount: Int {
    return dynamicArgumentTypes.count - (takesOwner ? 1 : 0)
  }

  var takesOwner: Bool = false

  func call(by owner: AnyObject?, withArguments args: [Any], appContext: AppContext, callback: @escaping (FunctionCallResult) -> Void) {
    var arguments: [Any]

    do {
      try validateArgumentsNumber(function: self, received: args.count)

      arguments = concat(
        arguments: args,
        withOwner: owner,
        withPromise: nil,
        forFunction: self,
        appContext: appContext
      )

      // All `JavaScriptValue` args must be preliminarly converted on the JS thread, before we jump to the function's queue.
      arguments = try cast(jsValues: arguments, forFunction: self, appContext: appContext)
    } catch let error as Exception {
      callback(.failure(error))
      return
    } catch {
      callback(.failure(UnexpectedException(error)))
      return
    }

    // Switch from the synchronous context to asynchronous
    Task { [arguments] in
      let result: Result<Any, Exception>

      do {
        // Convert arguments to the types desired by the function.
        let finalArguments = try cast(arguments: arguments, forFunction: self, appContext: appContext)

        // TODO: Right now we force cast the tuple in all types of functions, but we should throw another exception here.
        // swiftlint:disable force_cast
        let argumentsTuple = try Conversions.toTuple(finalArguments) as! Args
        let returnValue = try await body(argumentsTuple)

        result = .success(returnValue)
      } catch let error as Exception {
        result = .failure(FunctionCallException(name).causedBy(error))
      } catch {
        result = .failure(UnexpectedException(error))
      }

      // Go back to the JS thread to execute the callback
      appContext.executeOnJavaScriptThread {
        callback(result)
      }
    }
  }

  // MARK: - JavaScriptObjectBuilder

  func build(appContext: AppContext) throws -> JavaScriptObject {
    return try appContext.runtime.createAsyncFunction(name, argsCount: argumentsCount) {
      [weak appContext, weak self, name] this, args, resolve, reject in

      guard let appContext else {
        let exception = Exceptions.AppContextLost()
        return reject(exception.code, exception.description, nil)
      }
      guard let self else {
        let exception = NativeFunctionUnavailableException(name)
        return reject(exception.code, exception.description, nil)
      }
      self.call(by: this, withArguments: args, appContext: appContext) { result in
        switch result {
        case .failure(let error):
          reject(error.code, error.description, nil)
        case .success(let value):
          // Convert some results to primitive types (e.g. records) or JS values (e.g. shared objects)
          let convertedResult = Conversions.convertFunctionResult(value, appContext: appContext, dynamicType: ~ReturnType.self)
          resolve(convertedResult)
        }
      }
    }
  }
}

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
