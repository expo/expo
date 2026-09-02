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
  private func call(_ appContext: AppContext, argumentsTuple: sending Args) async throws -> JavaScriptValue {
    do {
      // Safe to mark as nonisolated(unsafe) — the tuple contains fully converted native values
      // with no references back to JS objects, so it can safely cross the actor boundary.
      nonisolated(unsafe) let nonisolatedArgumentsTuple = argumentsTuple

      let returnValue: ReturnType = if requiresMainActor {
        try await callBodyOnMainActor(nonisolatedArgumentsTuple)
      } else {
        try await body(nonisolatedArgumentsTuple)
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
    // The closure is the synchronous decode phase of the async host function: it runs within the
    // host call, while the borrowed `this` and the consumed arguments buffer are still valid,
    // and returns the async body. Only the converted native tuple crosses the asynchronous
    // boundary, so a call abandoned on reload leaves no JSI-owned values in its task frame.
    // Errors thrown here (including `AppContextLost`) reject the returned promise.
    return try appContext.runtime.createAsyncFunction(name) { [weak appContext, self] this, arguments in
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }

      let argumentsTuple: Args

      do {
        // Promote the borrowed `this` only when the function converts it to its owner; the owning
        // value stays within the decode phase.
        let owner: JavaScriptValue = self.takesOwner ? this.copied(in: try appContext.runtime) : .undefined
        argumentsTuple = try self.decodeArguments(appContext: appContext, this: owner, arguments: arguments)
      } catch let error as Exception {
        throw FunctionCallException(self.name).causedBy(error)
      } catch {
        throw UnexpectedException(error)
      }

      return {
        return try await self.call(appContext, argumentsTuple: argumentsTuple)
      }
    }.asObject()
  }

  // MARK: - Privates

  @JavaScriptActor
  private func decodeArguments(
    appContext: AppContext,
    this: JavaScriptValue,
    arguments: borrowing JavaScriptValuesBuffer
  ) throws -> Args {
    try validateArgumentsNumber(function: self, received: arguments.count)

    let nativeArguments = try toNativeClosureArguments(converter: appContext.converter, fn: self, this: this, arguments: arguments)

    guard let argumentsTuple: Args = try Conversions.toTuple(nativeArguments) else {
      throw ArgumentConversionException()
    }

    return argumentsTuple
  }

  @MainActor
  private func callBodyOnMainActor(_ args: sending Args) async throws -> sending ReturnType {
    return try await body(args)
  }
}
