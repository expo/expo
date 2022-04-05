// Copyright 2022-present 650 Industries. All rights reserved.

public extension JavaScriptRuntime {
  /**
   Evaluates JavaScript code represented as a string.

   - Parameter source: A string representing a JavaScript expression, statement, or sequence of statements.
                       The expression can include variables and properties of existing objects.
   - Returns: The completion value of evaluating the given code represented as `JavaScriptValue`.
              If the completion value is empty, `undefined` is returned.
   - Note: It wraps the original `evaluateScript` to better handle and rethrow exceptions.
   */
  func eval(_ source: String) throws -> JavaScriptValue {
    return try evaluateScript(source)
  }
}
