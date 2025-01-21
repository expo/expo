// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Represents a concurrent function that can only be called asynchronously, thus its JavaScript equivalent returns a Promise.
 As opposed to `AsyncFunctionDefinition`, it can leverage the new Swift's concurrency model and take the async/await closure.
 */
public final class ConcurrentFunctionDefinition<Args, FirstArgType, ReturnType>: AnyFunctionDefinition {
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
