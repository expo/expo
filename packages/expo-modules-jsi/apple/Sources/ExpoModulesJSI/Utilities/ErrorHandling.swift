internal import jsi
internal import ExpoModulesJSI_Cxx

/**
 Gets the recently thrown `expo.CppError` that was not handled by Swift yet.
 */
private func getCurrentCppError() -> expo.CppError? {
  if let current = expo.CppError.getCurrent() {
    return current.move()
  }
  return nil
}

/**
 Executes given block (calling potentially throwing C++ functions) and captures C++ exceptions
 thrown within the block passed to `expo::CppError::tryCatch` call in C++.
 */
internal func capturingCppErrors<R: ~Copyable>(_ block: () throws -> R) throws -> R {
  let result: R = try block()
  if let cppError = getCurrentCppError() {
    throw cppError
  }
  return result
}
