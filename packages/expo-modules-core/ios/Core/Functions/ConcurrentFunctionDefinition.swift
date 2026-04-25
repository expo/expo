// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 Type-erased protocol for asynchronous functions using Swift concurrency.
 */
internal protocol AnyConcurrentFunctionDefinition: AnyFunctionDefinition {
  /**
   Specifies if the main actor should be used. Necessary when attached to a view.
   */
  var requiresMainActor: Bool { get set }
}

/**
 Represents a concurrent function that can only be called asynchronously, thus its JavaScript equivalent returns a Promise.
 As opposed to `AsyncFunctionDefinition`, it can leverage the new Swift's concurrency model and take the async/await closure.
 */
public class ConcurrentFunctionDefinition<Args, FirstArgType, ReturnType>: AnyConcurrentFunctionDefinition, @unchecked Sendable {
  typealias ClosureType = @Sendable (Args) async throws -> sending ReturnType

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
    self.trailingOptionalArgumentsCount = dynamicArgumentTypes
      .reversed()
      .prefix(while: { $0 is DynamicOptionalType })
      .count
  }

  // MARK: - AnyFunction

  let name: String

  let dynamicArgumentTypes: [AnyDynamicType]

  private let trailingOptionalArgumentsCount: Int

  var argumentsCount: Int {
    return dynamicArgumentTypes.count - (takesOwner ? 1 : 0)
  }

  var requiredArgumentsCount: Int {
    return argumentsCount - trailingOptionalArgumentsCount
  }

  var takesOwner: Bool = false
  var requiresMainActor: Bool = false

  @JavaScriptActor
  func call(_ appContext: AppContext, this: JavaScriptValue, arguments: consuming JavaScriptValuesBuffer) async throws -> JavaScriptValue {
    let nativeArguments = NonisolatedUnsafeVar<[Any]>([])

    do {
      try validateArgumentsNumber(function: self, received: arguments.count)

      // Arguments must be converted on the JS thread, before we jump to another thread.
      nativeArguments.value = try toNativeClosureArguments(converter: appContext.converter, fn: self, this: this, arguments: arguments)

      guard let argumentsTuple = try Conversions.toTuple(nativeArguments.value) as? Args else {
        throw ArgumentConversionException()
      }
      let returnValue = if requiresMainActor {
        try await callBodyOnMainActor(consume argumentsTuple)
      } else {
        try await body(consume argumentsTuple)
      }

      return try await appContext.runtime.execute {
        return try appContext.converter.toJS(returnValue, ~ReturnType.self)
      }
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

  // MARK: - Privates

  @MainActor
  private func callBodyOnMainActor(_ args: sending Args) async throws -> sending ReturnType {
    return try await body(args)
  }
}
