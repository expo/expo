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

/**
 Runs a Swift trampoline body called from a C++ host callback and forwards any thrown error
 to `expo::CppError`'s thread-local storage so the C++ side can rethrow it as a `jsi::JSError`.
 On the failure branch returns `undefined`, since the C++ side will overwrite it by throwing
 the rethrown `jsi::JSError` before the value is observed by JS. Used by host function and
 host object getter trampolines on a hot path, hence `@_transparent` to inline into the
 caller and avoid a function-call boundary.
 */
@_transparent
internal func forwardingSwiftErrorsToJS(
  runtime: JavaScriptRuntime,
  _ body: () throws -> facebook.jsi.Value
) -> facebook.jsi.Value {
  do {
    return try body()
  } catch let throwable as JavaScriptThrowable {
    expo.CppError.setCurrent(JavaScriptError(runtime, from: throwable).toJSError())
  } catch let cppError as expo.CppError {
    // Re-thrown by `capturingCppErrors` when nested JSI work raised a JS error; relay
    // the original so its `jsi::JSError` (with stack, code, custom properties) survives.
    expo.CppError.setCurrent(cppError)
  } catch let error {
    expo.CppError.setCurrent(runtime.pointee, std.string(String(describing: error)))
  }
  return .undefined()
}

/**
 Void overload of `forwardingSwiftErrorsToJS` for host object setter trampolines, which
 have no return value to propagate.
 */
@_transparent
internal func forwardingSwiftErrorsToJS(
  runtime: JavaScriptRuntime,
  _ body: () throws -> Void
) {
  do {
    try body()
  } catch let throwable as JavaScriptThrowable {
    expo.CppError.setCurrent(JavaScriptError(runtime, from: throwable).toJSError())
  } catch let cppError as expo.CppError {
    expo.CppError.setCurrent(cppError)
  } catch let error {
    expo.CppError.setCurrent(runtime.pointee, std.string(String(describing: error)))
  }
}
