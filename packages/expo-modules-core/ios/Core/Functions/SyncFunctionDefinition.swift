// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

/**
 Type-erased protocol for synchronous functions.
 */
internal protocol AnySyncFunctionDefinition: AnyFunctionDefinition, ~Copyable {
  /**
   Calls the function synchronously with given `this` and arguments as JavaScript values.
   It **must** be run on the thread used by the JavaScript runtime.
   */
  @discardableResult
  @JavaScriptActor
  func call(_ appContext: AppContext, this: borrowing JavaScriptValue, arguments: consuming JSValuesBuffer) throws(Exception) -> JavaScriptValue
}

/**
 Represents a function that can only be called synchronously.
 */
public class SyncFunctionDefinition<Args, FirstArgType, ReturnType>: AnySyncFunctionDefinition, @unchecked Sendable {
  typealias ClosureType = (Args) throws -> ReturnType

  /**
   The underlying closure to run when the function is called.
   */
  let body: ClosureType

  init(
    _ name: String,
    firstArgType: FirstArgType.Type,
    dynamicArgumentTypes: [AnyDynamicType],
    returnType: AnyDynamicType = ~ReturnType.self,
    _ body: @escaping ClosureType
  ) {
    self.name = name
    self.dynamicArgumentTypes = dynamicArgumentTypes
    self.returnType = returnType
    self.body = body
  }

  // MARK: - AnyFunction

  let name: String

  let dynamicArgumentTypes: [AnyDynamicType]

  let returnType: AnyDynamicType

  var argumentsCount: Int {
    return dynamicArgumentTypes.count - (takesOwner ? 1 : 0)
  }

  var takesOwner: Bool = false

  // MARK: - AnySyncFunctionDefinition

  @JavaScriptActor
  func call(_ appContext: AppContext, this: borrowing JavaScriptValue, arguments: consuming JSValuesBuffer) throws(Exception) -> JavaScriptValue {
    do {
      try validateArgumentsNumber(function: self, received: arguments.count)
      let nativeArguments = try toNativeClosureArguments(converter: appContext.converter, fn: self, this: this, arguments: arguments)

      guard let argumentsTuple = try Conversions.toTuple(nativeArguments) as? Args else {
        throw ArgumentConversionException()
      }
      let result = try body(argumentsTuple)

      return try appContext.converter.toJS(result, returnType)
    } catch let error as Exception {
      throw FunctionCallException(name).causedBy(error)
    } catch {
      throw UnexpectedException(error)
    }
  }

//  func call(_ appContext: AppContext, this: borrowing JavaScriptValue, arguments: consuming JSValuesBuffer, callback: @escaping @Sendable (consuming FunctionCallResult) -> Void) {
//    do {
//      callback(.success(try call(appContext, this: this, arguments: arguments)))
//    } catch let error {
//      callback(.failure(error))
//    }
//  }

  // MARK: - JavaScriptObjectBuilder

  @JavaScriptActor
  func build(appContext: AppContext) throws -> JavaScriptObject {
    // We intentionally capture a strong reference to `self`, otherwise the "detached" objects would
    // immediately lose the reference to the definition and thus the underlying native function.
    // It may potentially cause memory leaks, but at the time of writing this comment,
    // the native definition instance deallocates correctly when the JS VM triggers the garbage collector.
    return try appContext.runtime.createSyncFunction(name) { [weak appContext, self] this, arguments in
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      return try self.call(appContext, this: this, arguments: arguments)
    }.asObject()
  }
}

@JavaScriptActor
internal func toNativeClosureArguments(
  converter: MainValueConverter,
  fn: AnyFunctionDefinition,
  this: borrowing JavaScriptValue,
  arguments: borrowing JSValuesBuffer,
) throws -> [Any] {
  // This array will include the owner (if needed) and function arguments.
  var nativeArguments: [Any] = []
  let receivedArgumentsCount = arguments.count

  // If the function takes the owner, convert it and add to the final arguments.
  if fn.takesOwner, !this.isUndefined(), let ownerType = fn.dynamicArgumentTypes.first {
    let nativeOwner = try converter.toNative(this, ownerType)
    nativeArguments.append(nativeOwner)
  }

  // Convert JS values to non-JS native types desired by the function.
  let dynamicTypesWithoutOwner = Array(fn.dynamicArgumentTypes.dropFirst(nativeArguments.count))
  nativeArguments.append(
    contentsOf: try converter.toNative(arguments, dynamicTypesWithoutOwner)
  )

  // Fill in with nils in place of missing optional arguments.
  if receivedArgumentsCount < fn.argumentsCount {
    let missingOptionals = Array(repeating: Any?.none as Any, count: fn.argumentsCount - receivedArgumentsCount)
    nativeArguments.append(contentsOf: missingOptionals)
  }
  return nativeArguments
}
