// Copyright 2022-present 650 Industries. All rights reserved.

// FIXME: Calling module's functions needs solid refactoring to not reference the module holder.
// Instead, it should be possible to directly call the function instance from here. (added by @tsapeta)

/**
 Creates a block that is executed when the module's async function is called.
 */
internal func createAsyncFunctionBlock(holder: ModuleHolder, name functionName: String) -> JSAsyncFunctionBlock {
  let moduleName = holder.name
  return { [weak holder, moduleName] args, resolve, reject in
    guard let holder = holder else {
      let exception = ModuleUnavailableException(moduleName)
      reject(exception.code, exception.description, exception)
      return
    }
    holder.call(function: functionName, args: args) { result, error in
      if let error = error {
        reject(error.code, error.description, error)
      } else {
        resolve(result)
      }
    }
  }
}

/**
 Creates a block that is executed when the module's sync function is called.
 */
internal func createSyncFunctionBlock(holder: ModuleHolder, name functionName: String) -> JSSyncFunctionBlock {
  return { [weak holder] args in
    guard let holder = holder else {
      return nil
    }
    return holder.callSync(function: functionName, args: args)
  }
}

// MARK: - Arguments

/**
 Tries to cast given argument to the type that is wrapped by the argument type.
 - Parameters:
  - argument: A value to be cast. If it's a ``JavaScriptValue``, it's first unpacked to the raw value.
  - argumentType: Something that implements ``AnyArgumentType`` and knows how to cast the argument.
 - Returns: A new value converted according to the argument type.
 - Throws: Rethrows various exceptions that could be thrown by the argument type wrappers.
 */
internal func castArgument(_ argument: Any, toType argumentType: AnyArgumentType) throws -> Any {
  // TODO: Accept JavaScriptValue and JavaScriptObject as argument types.
  if let argument = argument as? JavaScriptValue {
    return try argumentType.cast(argument.getRaw())
  }
  return try argumentType.cast(argument)
}

/**
 Same as ``castArgument(_:argumentType:)`` but for an array of arguments.
 - Parameters:
   - arguments: An array of arguments to be cast.
   - argumentTypes: An array of argument types in the same order as the array of arguments.
 - Returns: An array of arguments after casting. Its size is the same as the input arrays.
 - Throws: ``InvalidArgsNumberException`` when the sizes of arrays passed as parameters are not equal.
   Rethrows exceptions thrown by ``castArgument(_:argumentType:)``.
 */
internal func castArguments(_ arguments: [Any], toTypes argumentTypes: [AnyArgumentType]) throws -> [Any] {
  if arguments.count != argumentTypes.count {
    throw InvalidArgsNumberException((received: arguments.count, expected: argumentTypes.count))
  }
  return try arguments.enumerated().map { index, argument in
    let argumentType = argumentTypes[index]

    do {
      return try castArgument(argument, toType: argumentType)
    } catch {
      throw ArgumentCastException((index: index, type: argumentType)).causedBy(error)
    }
  }
}

internal class InvalidArgsNumberException: GenericException<(received: Int, expected: Int)> {
  override var reason: String {
    "Received \(param.received) arguments, but \(param.expected) was expected"
  }
}

internal class ArgumentCastException: GenericException<(index: Int, type: AnyArgumentType)> {
  override var reason: String {
    "Argument at index '\(param.index)' couldn't be cast to type \(param.type.description)"
  }
}

// MARK: - Exceptions

private class ModuleUnavailableException: GenericException<String> {
  override var reason: String {
    "Module '\(param)' is no longer available"
  }
}
