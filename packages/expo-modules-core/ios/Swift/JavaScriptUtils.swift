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
internal func cast(_ value: Any, toType type: AnyDynamicType) throws -> Any {
  // TODO: Accept JavaScriptValue and JavaScriptObject as argument types.
  if !(type is DynamicTypedArrayType), let value = value as? JavaScriptValue {
    return try type.cast(value.getRaw())
  }
  return try type.cast(value)
}

/**
 Tries to cast the given arguments to the types expected by the function.
 - Parameters:
   - arguments: An array of arguments to be cast.
   - function: A function for which to cast the arguments.
 - Returns: An array of arguments after casting. Its size is the same as the input arrays.
 - Throws: `InvalidArgsNumberException` when the number of arguments is not equal to the actual number
 of function's arguments (without an owner and promise). Rethrows exceptions thrown by `cast(_:toType:)`.
 */
internal func cast(arguments: [Any], forFunction function: AnyFunction) throws -> [Any] {
  if arguments.count != function.argumentsCount {
    throw InvalidArgsNumberException((received: arguments.count, expected: function.argumentsCount))
  }
  let argumentTypeOffset = function.takesOwner ? 1 : 0
  return try arguments.enumerated().map { index, argument in
    let argumentType = function.dynamicArgumentTypes[index + argumentTypeOffset]

    do {
      return try cast(argument, toType: argumentType)
    } catch {
      throw ArgumentCastException((index: index, type: argumentType)).causedBy(error)
    }
  }
}

/**
 Prepends the owner to the array of arguments if the given function can take it.
 */
internal func concat(arguments: [Any], withOwner owner: AnyObject?, forFunction function: AnyFunction) -> [Any] {
  if function.takesOwner, let owner = try? function.dynamicArgumentTypes.first?.cast(owner) {
    return [owner] + arguments
  }
  return arguments
}

// MARK: - Exceptions

internal class InvalidArgsNumberException: GenericException<(received: Int, expected: Int)> {
  override var reason: String {
    "Received \(param.received) arguments, but \(param.expected) was expected"
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
