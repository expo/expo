internal import ExpoModulesJSI_Cxx
internal import jsi

/// Gets the recently thrown `expo.CppError` that was not handled by Swift yet.
private func getCurrentCppError() -> expo.CppError? {
  if let current = expo.CppError.getCurrent() {
    return current.move()
  }
  return nil
}

/// Executes given block (calling potentially throwing C++ functions) and captures C++ exceptions
/// thrown within the block passed to `expo::CppError::tryCatch` call in C++.
internal func capturingCppErrors<R: ~Copyable>(_ block: () throws -> R) throws -> R {
  let result: R = try block()
  if let cppError = getCurrentCppError() {
    throw cppError
  }
  return result
}

/// Runs a Swift trampoline body called from a C++ host callback and forwards any thrown error
/// to `expo::CppError`'s thread-local storage so the C++ side can rethrow it as a `jsi::JSError`.
/// On the failure branch returns `undefined`, since the C++ side will overwrite it by throwing
/// the rethrown `jsi::JSError` before the value is observed by JS. Used by host function and
/// host object getter trampolines on a hot path, hence `@_transparent` to inline into the
/// caller and avoid a function-call boundary.
@_transparent
internal func forwardingSwiftErrorsToJS(
  runtime: JavaScriptRuntime,
  _ body: () throws -> facebook.jsi.Value
) -> facebook.jsi.Value {
  do {
    return try body()
  } catch {
    storeSwiftError(error, runtime: runtime)
    return .undefined()
  }
}

/// Overload for trampolines that write their result into the caller's slot themselves. Returns
/// whether an error was stored, so the C++ caller reads the thread-local error slot only then and
/// skips the thread-local access on every successful call.
@_transparent
internal func forwardingSwiftErrorsToJS(
  runtime: JavaScriptRuntime,
  _ body: () throws -> Void
) -> Bool {
  do {
    try body()
    return false
  } catch {
    storeSwiftError(error, runtime: runtime)
    return true
  }
}

/// Stores an error thrown by a host callback in `expo::CppError`'s thread-local slot for the C++
/// side to rethrow as a `jsi::JSError`. Kept out of line on purpose: the trampolines above inline
/// into every host callback, and with the error handling in their bodies the hot path carried the
/// stack frame and register saves that only these branches need.
@inline(never)
internal func storeSwiftError(_ error: any Error, runtime: JavaScriptRuntime) {
  switch error {
  case let jsError as JavaScriptError:
    // Relay the wrapped `jsi::JSError` directly so the thrown value reaches JS as-is, which may be
    // an arbitrary value rather than an `Error` instance.
    expo.CppError.setCurrent(jsError.toJSError())
  case let throwable as JavaScriptThrowable:
    expo.CppError.setCurrent(JavaScriptError(runtime, from: throwable).toJSError())
  case let cppError as expo.CppError:
    // Re-thrown by `capturingCppErrors` when nested JSI work raised a JS error; relay
    // the original so its `jsi::JSError` (with stack, code, custom properties) survives.
    expo.CppError.setCurrent(cppError)
  default:
    expo.CppError.setCurrent(runtime.pointee, std.string(String(describing: error)))
  }
}
