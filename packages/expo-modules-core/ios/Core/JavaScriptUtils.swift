// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

// MARK: - Arguments

/**
 Validates whether the number of received arguments is enough to call the given function.
 Throws `InvalidArgsNumberException` otherwise.
 */
@_transparent
internal func validateArgumentsNumber<F: AnyFunctionDefinition>(function: borrowing F, received: Int) throws {
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
    result = [owner as Any] + arguments
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

internal final class InvalidArgsNumberException: GenericException<(received: Int, expected: Int, required: Int)>, @unchecked Sendable {
  override var reason: String {
    if param.required < param.expected {
      return "Received \(param.received) arguments, but \(param.expected) was expected and at least \(param.required) is required"
    }
  return "Received \(param.received) arguments, but \(param.expected) was expected"
  }
}

internal final class ArgumentCastException: GenericException<(index: Int, type: AnyDynamicType)>, @unchecked Sendable {
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

private final class ModuleUnavailableException: GenericException<String>, @unchecked Sendable {
  override var reason: String {
    "Module '\(param)' is no longer available"
  }
}
