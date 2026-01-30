// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 Type-erased protocol for asynchronous functions using Swift concurrency
 */
internal protocol AnyConcurrentFunctionDefinition: AnyFunctionDefinition {
  /**
   Specifies if the main actor should be used. Necessary when attached to a view
   */
  var requiresMainActor: Bool { get set }
}

/**
 Represents a concurrent function that can only be called asynchronously, thus its JavaScript equivalent returns a Promise.
 As opposed to `AsyncFunctionDefinition`, it can leverage the new Swift's concurrency model and take the async/await closure.
 */
public final class ConcurrentFunctionDefinition<Args, FirstArgType, ReturnType>: AnyConcurrentFunctionDefinition, @unchecked Sendable {
  typealias ClosureType = @JavaScriptActor (Args) async throws -> ReturnType

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
  var requiresMainActor: Bool = false

  @JavaScriptActor
  func call(_ appContext: AppContext, this: borrowing JavaScriptValue, arguments: consuming JSValuesBuffer, callback: @Sendable @escaping (consuming FunctionCallResult) -> Void) {
    let nativeArguments = NonisolatedUnsafeVar<[Any]>([])

    do {
      try validateArgumentsNumber(function: self, received: arguments.count)

      // Arguments must be converted on the JS thread, before we jump to another thread.
      nativeArguments.value = try toNativeClosureArguments(converter: appContext.converter, fn: self, this: this, arguments: arguments)
    } catch let error as Exception {
      callback(.failure(error))
      return
    } catch {
      callback(.failure(UnexpectedException(error)))
      return
    }

    // Switch from the synchronous context to asynchronous
    Task { [nativeArguments] in
      let result: Result<Any, Exception>

      do {
        // Convert arguments to the types desired by the function.
//        let finalArguments = NonisolatedUnsafeVar<[Any]>([])

//        if requiresMainActor {
//          try await MainActor.run {
//            finalArguments.value = try cast(arguments: arguments.value, forFunction: self, appContext: appContext)
//          }
//        } else {
//          finalArguments.value = try cast(arguments: arguments.value, forFunction: self, appContext: appContext)
//        }

        guard let argumentsTuple = try Conversions.toTuple(nativeArguments.value) as? Args else {
          throw ArgumentConversionException()
        }
        let returnValue = try await body(argumentsTuple)

        result = .success(returnValue)
      } catch let error as Exception {
        result = .failure(FunctionCallException(name).causedBy(error))
      } catch {
        result = .failure(UnexpectedException(error))
      }

      // Go back to the JS thread to execute the callback
      try appContext.runtime.schedule {
        do {
          callback(.success(try appContext.converter.toJS(result.get(), ~ReturnType.self).ref()))
        } catch let error as Exception {
          callback(.failure(error))
        } catch {
          callback(.failure(UnexpectedException(error)))
        }
      }
    }
  }

  @JavaScriptActor
  func call(_ appContext: AppContext, this: borrowing JavaScriptValue, arguments: consuming JSValuesBuffer) async throws -> JavaScriptValue {
    var nativeArguments: [Any?] = []

    do {
      try validateArgumentsNumber(function: self, received: arguments.count)

      // Arguments must be converted on the JS thread, before we jump to another thread.
      nativeArguments = try toNativeClosureArguments(converter: appContext.converter, fn: self, this: this, arguments: arguments)

      guard let argumentsTuple = try Conversions.toTuple(nativeArguments) as? Args else {
        throw ArgumentConversionException()
      }
      let returnValue = try await body(argumentsTuple)

      return try appContext.converter.toJS(returnValue, ~ReturnType.self)
    } catch let error as Exception {
      throw FunctionCallException(name).causedBy(error)
    } catch {
      throw UnexpectedException(error)
    }
  }

  // MARK: - JavaScriptObjectBuilder

  @JavaScriptActor
  func build(appContext: AppContext) throws -> JavaScriptObject {
    return try appContext.runtime.createAsyncFunction(name) { [weak appContext, self] this, arguments in
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      return try await self.call(appContext, this: this, arguments: arguments)
    }.asObject()
  }
}
