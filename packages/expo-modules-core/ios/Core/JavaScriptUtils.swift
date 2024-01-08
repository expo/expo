// Copyright 2022-present 650 Industries. All rights reserved.

// MARK: - Arguments

/**
 Tries to cast a given value to the type that is wrapped by the dynamic type.
 - Parameters:
  - value: A value to be cast. If it's a ``JavaScriptValue``, it's first unpacked to the raw value.
  - type: Something that implements ``AnyDynamicType`` and knows how to cast the argument.
 - Returns: A new value converted according to the dynamic type.
 - Throws: Rethrows various exceptions that could be thrown by the dynamic types.
 */
internal func cast(_ value: Any, toType type: AnyDynamicType, appContext: AppContext) throws -> Any {
  if let dynamicJSType = type as? DynamicJavaScriptType, dynamicJSType.equals(~JavaScriptValue.self)  {
    return value
  }
  if !(type is DynamicTypedArrayType), let value = value as? JavaScriptValue {
    return try type.cast(value.getRaw(), appContext: appContext)
  }
  return try type.cast(value, appContext: appContext)
}

/**
 Tries to cast the given arguments to the types expected by the function.
 - Parameters:
   - arguments: An array of arguments to be cast.
   - function: A function for which to cast the arguments.
   - appContext: A context of the app.
 - Returns: An array of arguments after casting. Its size is the same as the input arrays.
 - Throws: `InvalidArgsNumberException` when the number of arguments is not equal to the actual number
 of function's arguments (without an owner and promise). Rethrows exceptions thrown by `cast(_:toType:)`.
 */
internal func cast(arguments: [Any], forFunction function: AnyFunctionDefinition, appContext: AppContext) throws -> [Any] {
  return try arguments.enumerated().map { index, argument in
    let argumentType = function.dynamicArgumentTypes[index]

    do {
      return try cast(argument, toType: argumentType, appContext: appContext)
    } catch {
      throw ArgumentCastException((index: index, type: argumentType)).causedBy(error)
    }
  }
}

/**
 Casts an array of JavaScript values to non-JavaScript types.
 */
internal func cast(jsValues: [Any], forFunction function: AnyFunctionDefinition, appContext: AppContext) throws -> [Any] {
  // TODO: Replace `[Any]` with `[JavaScriptValue]` once we make sure only JS values are passed here
  return try jsValues.enumerated().map { index, jsValue in
    let type = function.dynamicArgumentTypes[index]

    do {
      // Temporarily some values might already be cast to primitive types, so make sure we cast only `JavaScriptValue` and leave the others as they are.
      if let jsValue = jsValue as? JavaScriptValue {
        return try type.cast(jsValue: jsValue, appContext: appContext)
      } else {
        return jsValue
      }
    } catch {
      throw ArgumentCastException((index: index, type: type)).causedBy(error)
    }
  }
}

/**
 Validates whether the number of received arguments is enough to call the given function.
 Throws `InvalidArgsNumberException` otherwise.
 */
internal func validateArgumentsNumber(function: AnyFunctionDefinition, received: Int) throws {
  let argumentsCount = function.argumentsCount
  let requiredArgumentsCount = function.requiredArgumentsCount

  if received < requiredArgumentsCount || received > argumentsCount {
    throw InvalidArgsNumberException((
      received: received,
      expected: argumentsCount,
      required: requiredArgumentsCount
    ))
  }
}

/**
 Ensures the provided array of arguments matches the number of arguments expected by the function.
 - If the function takes the owner, it's added to the beginning.
 - If the array is still too small, missing arguments are very likely to be optional so it puts `nil` in their place.
 */
internal func concat(
  arguments: [Any],
  withOwner owner: AnyObject?,
  withPromise promise: Promise?,
  forFunction function: AnyFunctionDefinition,
  appContext: AppContext
) -> [Any] {
  var result = arguments

  if function.takesOwner {
    result = [owner] + arguments
  }
  if arguments.count < function.argumentsCount {
    result += Array(repeating: Any?.none as Any, count: function.argumentsCount - arguments.count)
  }
  // Add promise to the array of arguments if necessary.
  if let promise {
    result += [promise]
  }
  return result
}

// MARK: - Exceptions

internal class InvalidArgsNumberException: GenericException<(received: Int, expected: Int, required: Int)> {
  override var reason: String {
    if param.required < param.expected {
      return "Received \(param.received) arguments, but \(param.expected) was expected and at least \(param.required) is required"
    } else {
      return "Received \(param.received) arguments, but \(param.expected) was expected"
    }
  }
}

internal class ArgumentCastException: GenericException<(index: Int, type: AnyDynamicType)> {
  override var reason: String {
    "The \(formatOrdinalNumber(param.index + 1)) argument cannot be cast to type \(param.type.description)"
  }

  func formatOrdinalNumber(_ number: Int) -> String {
    let formatter = NumberFormatter()
    formatter.numberStyle = .ordinal
    formatter.locale = Locale(identifier: "en_US")
    return formatter.string(from: NSNumber(value: number)) ?? ""
  }
}

private class ModuleUnavailableException: GenericException<String> {
  override var reason: String {
    "Module '\(param)' is no longer available"
  }
}
