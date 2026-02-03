// Copyright 2025-present 650 Industries. All rights reserved.

/**
 Worklet-callable view function with no extra arguments (just the view).
 */
public func WorkletFunction<ViewType>(
  _ name: String,
  _ closure: @escaping (ViewType) throws -> Void
) -> WorkletViewFunctionDefinition {
  return WorkletViewFunctionDefinition(name: name) { view, _ in
    guard let typedView = view as? ViewType else {
      throw WorkletViewFunctionCastException(name)
    }
    try closure(typedView)
    return nil
  }
}

/**
 Worklet-callable view function with one extra argument.
 */
public func WorkletFunction<ViewType, A0>(
  _ name: String,
  _ closure: @escaping (ViewType, A0) throws -> Void
) -> WorkletViewFunctionDefinition {
  return WorkletViewFunctionDefinition(name: name) { view, args in
    guard let typedView = view as? ViewType else {
      throw WorkletViewFunctionCastException(name)
    }
    guard args.count >= 1, let a0 = args[0] as? A0 else {
      throw WorkletViewFunctionArgumentException(name, expected: 1, received: args.count)
    }
    try closure(typedView, a0)
    return nil
  }
}

// MARK: - With return value

/**
 Worklet-callable view function with no extra arguments and a return value.
 */
public func WorkletFunction<ViewType, R>(
  _ name: String,
  _ closure: @escaping (ViewType) throws -> R
) -> WorkletViewFunctionDefinition {
  return WorkletViewFunctionDefinition(name: name) { view, _ in
    guard let typedView = view as? ViewType else {
      throw WorkletViewFunctionCastException(name)
    }
    return try closure(typedView)
  }
}

/**
 Worklet-callable view function with one extra argument and a return value.
 */
public func WorkletFunction<ViewType, A0, R>(
  _ name: String,
  _ closure: @escaping (ViewType, A0) throws -> R
) -> WorkletViewFunctionDefinition {
  return WorkletViewFunctionDefinition(name: name) { view, args in
    guard let typedView = view as? ViewType else {
      throw WorkletViewFunctionCastException(name)
    }
    guard args.count >= 1, let a0 = args[0] as? A0 else {
      throw WorkletViewFunctionArgumentException(name, expected: 1, received: args.count)
    }
    return try closure(typedView, a0)
  }
}

// swiftlint:enable identifier_name

// MARK: - Exceptions

internal final class WorkletViewFunctionCastException: GenericException<String> {
  override var reason: String {
    "Could not cast view to expected type for worklet function '\(param)'"
  }
}

internal final class WorkletViewFunctionArgumentException: Exception {
  let functionName: String
  let expected: Int
  let received: Int

  init(_ functionName: String, expected: Int, received: Int) {
    self.functionName = functionName
    self.expected = expected
    self.received = received
    super.init()
  }

  override var reason: String {
    "Worklet function '\(functionName)' expected \(expected) argument(s) but received \(received)"
  }
}
