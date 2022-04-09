// Copyright 2022-present 650 Industries. All rights reserved.

public extension JavaScriptRuntime {
  /**
   Evaluates JavaScript code represented as a string.

   - Parameter source: A string representing a JavaScript expression, statement, or sequence of statements.
                       The expression can include variables and properties of existing objects.
   - Returns: The completion value of evaluating the given code represented as `JavaScriptValue`.
              If the completion value is empty, `undefined` is returned.
   - Throws: `JavaScriptEvalException` when evaluated code has invalid syntax or throws an error.
   - Note: It wraps the original `evaluateScript` to better handle and rethrow exceptions.
   */
  func eval(_ source: String) throws -> JavaScriptValue {
    do {
      var result: JavaScriptValue?
      try EXUtilities.catchException {
        result = self.evaluateScript(source)
      }
      // There is no risk to force unwrapping as long as the `evaluateScript` returns nonnull value.
      return result!
    } catch {
      throw JavaScriptEvalException(error as NSError)
    }
  }
}

internal final class JavaScriptEvalException: GenericException<NSError> {
  override var reason: String {
    return param.userInfo["message"] as? String ?? "unknown reason"
  }
}
