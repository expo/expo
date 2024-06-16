// Copyright 2022-present 650 Industries. All rights reserved.

import Dispatch

/**
 Type-erased protocol for asynchronous functions.
 */
internal protocol AnyAsyncFunctionDefinition: AnyFunctionDefinition {
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
public final class AsyncFunctionDefinition<Args, FirstArgType, ReturnType>: AnyAsyncFunctionDefinition {
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
    self.dynamicArgumentTypes = dynamicArgumentTypes
    self.body = body
  }

  // MARK: - AnyFunction

  let name: String

  let dynamicArgumentTypes: [AnyDynamicType]

  var argumentsCount: Int {
    return dynamicArgumentTypes.count - (takesOwner ? 1 : 0) - (takesPromise ? 1 : 0)
  }

  var takesOwner: Bool = false

  func call(by owner: AnyObject?, withArguments args: [Any], appContext: AppContext, callback: @escaping (FunctionCallResult) -> ()) {
    let promise = Promise { value in
      callback(.success(Conversions.convertFunctionResult(value)))
    } rejecter: { exception in
      callback(.failure(exception))
    }
    var arguments: [Any] = concat(
      arguments: args,
      withOwner: owner,
      withPromise: takesPromise ? promise : nil,
      forFunction: self,
      appContext: appContext
    )

    do {
      try validateArgumentsNumber(function: self, received: args.count)

      // All `JavaScriptValue` args must be preliminarly converted on the JS thread, so before we jump to the function's queue.
      arguments = try cast(jsValues: arguments, forFunction: self, appContext: appContext)
    } catch let error as Exception {
      callback(.failure(error))
      return
    } catch {
      callback(.failure(UnexpectedException(error)))
      return
    }

    let queue = queue ?? defaultQueue

    queue.async { [body, name] in
      let returnedValue: ReturnType?

      do {
        // Convert arguments to the types desired by the function.
        arguments = try cast(arguments: arguments, forFunction: self, appContext: appContext)

        // swiftlint:disable:next force_cast
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

  func build(appContext: AppContext) throws -> JavaScriptObject {
    // It seems to be safe to capture a strong reference to `self` here. This is needed for detached functions, that are not part of the module definition.
    // Module definitions are held in memory anyway, but detached definitions (returned by other functions) are not, so we need to capture them here.
    // It will be deallocated when that JS host function is garbage-collected by the JS VM.
    return try appContext.runtime.createAsyncFunction(name, argsCount: argumentsCount) { [self] this, args, resolve, reject in
      self.call(by: this, withArguments: args, appContext: appContext) { result in
        switch result {
        case .failure(let error):
          reject(error.code, error.description, nil)
        case .success(let value):
          resolve(value)
        }
      }
    }
  }

  // MARK: - AnyAsyncFunctionDefinition

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
