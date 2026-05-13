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
  func call(_ appContext: AppContext, in runtime: JavaScriptRuntime, this: JavaScriptValue, arguments: consuming JavaScriptValuesBuffer) throws(Exception) -> JavaScriptValue

  /**
   Runs the underlying body with the given arguments and returns the raw native result,
   without converting it to a JavaScript value. Used by class constructors, which need the
   native result (e.g. a `SharedObject`) to pair with the JS `this` instance directly.
   */
  @JavaScriptActor
  func runBody(_ appContext: AppContext, in runtime: JavaScriptRuntime, this: JavaScriptValue, arguments: consuming JavaScriptValuesBuffer) throws(Exception) -> Any

  /**
   Builds the sync function in a specific runtime.
   Used to install functions in alternate runtimes (e.g. the worklet runtime).
   */
  @JavaScriptActor
  func build(appContext: AppContext, in runtime: JavaScriptRuntime) throws -> JavaScriptObject
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
    self.trailingOptionalArgumentsCount = dynamicArgumentTypes
      .reversed()
      .prefix(while: { $0 is DynamicOptionalType })
      .count
  }

  // MARK: - AnyFunction

  let name: String

  let dynamicArgumentTypes: [AnyDynamicType]

  let returnType: AnyDynamicType

  private let trailingOptionalArgumentsCount: Int

  var argumentsCount: Int {
    return dynamicArgumentTypes.count - (takesOwner ? 1 : 0)
  }

  var requiredArgumentsCount: Int {
    return argumentsCount - trailingOptionalArgumentsCount
  }

  var takesOwner: Bool = false

  // MARK: - AnySyncFunctionDefinition

  @JavaScriptActor
  @discardableResult
  func runBody(_ appContext: AppContext, in runtime: JavaScriptRuntime, this: JavaScriptValue, arguments: consuming JavaScriptValuesBuffer) throws(Exception) -> Any {
    do {
      try validateArgumentsNumber(function: self, received: arguments.count)
      let nativeArguments = try toNativeClosureArguments(converter: appContext.converter, fn: self, this: this, arguments: arguments)
      guard let argumentsTuple: Args = try Conversions.toTuple(nativeArguments) else {
        throw ArgumentConversionException()
      }
      return try body(argumentsTuple) as Any
    } catch let error as Exception {
      throw FunctionCallException(name).causedBy(error)
    } catch {
      throw UnexpectedException(error)
    }
  }

  @JavaScriptActor
  func call(_ appContext: AppContext, in runtime: JavaScriptRuntime, this: JavaScriptValue, arguments: consuming JavaScriptValuesBuffer) throws(Exception) -> JavaScriptValue {
    let result = try runBody(appContext, in: runtime, this: this, arguments: arguments)
    do {
      return try appContext.converter.toJS(result, returnType, in: runtime)
    } catch let error as Exception {
      throw FunctionCallException(name).causedBy(error)
    } catch {
      throw UnexpectedException(error)
    }
  }

  // MARK: - JavaScriptObjectBuilder

  @JavaScriptActor
  func build(appContext: AppContext) throws -> JavaScriptObject {
    return try build(appContext: appContext, in: appContext.runtime)
  }

  /**
   Builds the sync function in a specific runtime.
   Used to install functions in alternate runtimes (e.g. the worklet runtime).
   */
  @JavaScriptActor
  func build(appContext: AppContext, in runtime: JavaScriptRuntime) throws -> JavaScriptObject {
    // We intentionally capture a strong reference to `self`, otherwise the "detached" objects would
    // immediately lose the reference to the definition and thus the underlying native function.
    // It may potentially cause memory leaks, but at the time of writing this comment,
    // the native definition instance deallocates correctly when the JS VM triggers the garbage collector.
    return runtime.createFunction(name) { [weak appContext, self] this, arguments in
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      return try self.call(appContext, in: runtime, this: this, arguments: arguments)
    }.asObject()
  }
}

@_transparent
@JavaScriptActor
internal func toNativeClosureArguments<F: AnyFunctionDefinition>(
  converter: borrowing MainValueConverter,
  fn: borrowing F,
  this: JavaScriptValue,
  arguments: borrowing JavaScriptValuesBuffer
) throws -> [Any] {
  if !fn.takesOwner, fn.argumentsCount == 0 {
    return []
  }

  var nativeArguments: [Any] = []
  nativeArguments.reserveCapacity(fn.dynamicArgumentTypes.count)

  // If the function takes the owner, convert it and add to the final arguments.
  if fn.takesOwner, !this.isUndefined(), let ownerType = fn.dynamicArgumentTypes.first {
    let nativeOwner = try converter.toNative(this, ownerType)
    nativeArguments.append(nativeOwner)
  }

  // Convert JS values to native types desired by the function.
  let typeOffset = nativeArguments.count
  for i in 0..<arguments.count {
    let type = fn.dynamicArgumentTypes[typeOffset + i]
    do {
      try nativeArguments.append(converter.toNative(arguments[i], type))
    } catch {
      throw ArgumentCastException((index: i, type: type)).causedBy(error)
    }
  }

  // Fill in with nils in place of missing optional arguments.
  for _ in arguments.count..<fn.argumentsCount {
    nativeArguments.append(Any?.none as Any)
  }
  return nativeArguments
}
