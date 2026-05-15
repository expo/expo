#pragma once

#include <exception>
#include <memory>
#include <swift/bridging>

#include "IRuntimeCompat.h"

namespace expo {

namespace jsi = facebook::jsi;

/**
 A thread-safe error handling class for capturing and propagating JavaScript
 errors across the C++/Swift boundary when working with JavaScript runtimes.

 Wraps a `jsi::JSError`, preserving its underlying JavaScript value (an Error
 object) so that downstream consumers can access the full error including
 message, stack, and any custom properties (like `code` and `userInfo`).

 ## Thread Safety
 Each thread maintains its own error state using thread-local storage, making
 this class safe to use across multiple threads without synchronization overhead.
 */
// Marked unchecked Sendable because instances live in thread-local storage and
// ownership is transferred by move — they are never shared across threads.
// `jsi::JSError` itself is not Sendable, so Swift cannot verify this automatically.
class SWIFT_UNCHECKED_SENDABLE CppError {
public:
  /**
   Creates a CppError from a `jsi::JSError`.
   */
  CppError(jsi::JSError jsError) : jsError(std::move(jsError)) {}

  /**
   The wrapped `jsi::JSError`.
   */
  jsi::JSError jsError;

  /**
   Moves the wrapped `jsi::JSError` out of this `CppError` and deletes `this`.
   The caller takes ownership of the returned error. After this call, the
   `CppError` pointer is invalid and must not be used.
   */
  jsi::JSError release() {
    jsi::JSError error = std::move(jsError);
    delete this;
    return error;
  }

  /**
   Returns the error message of the wrapped `jsi::JSError`.
   Renamed to `_message` in Swift so that an extension can expose a clean
   `message: String` accessor that wraps the underlying `std::string`.
   See `expo.CppError` extension in `JavaScriptError.swift`.
   */
  SWIFT_COMPUTED_PROPERTY
  inline std::string getMessage() const SWIFT_NAME(_getMessage()) {
    return jsError.getMessage();
  }

  /**
   Returns the underlying JavaScript value of the wrapped `jsi::JSError`.
   This is a JavaScript Error object with all its properties preserved.
   */
  inline jsi::Value asValue(jsi::IRuntime &runtime) noexcept {
    return jsi::Value(runtime, jsError.value());
  }

  /**
   Executes a block of code and catches any C++ exceptions that are thrown.
   Caught exceptions are stored in thread-local storage and can be retrieved
   using `getCurrent()`. The function returns `nullptr` when an exception occurs.
   */
  template <typename Result>
  inline static Result tryCatch(jsi::IRuntime &runtime, Result(^block)(void)) {
    try {
      return block();
    } catch (jsi::JSError e) {
      _current = std::make_unique<CppError>(std::move(e));
    } catch (const std::exception &e) {
      _current = std::make_unique<CppError>(jsi::JSError(runtime, e.what()));
    } catch (...) {
      _current = std::make_unique<CppError>(jsi::JSError(runtime, "Unknown C++ error"));
    }
    return nullptr;
  }

  /**
   Retrieves the current thread's error and transfers ownership to the caller.
   After calling this method, the thread-local error state is reset to `nullptr`,
   and the caller becomes responsible for deleting the returned pointer.
   */
  inline static CppError* getCurrent() {
    return _current.release();
  }

  /**
   Sets the current thread's error from a pre-built `jsi::JSError`.
   Called from Swift when a host function closure throws a JavaScriptThrowable error.
   */
  inline static void setCurrent(jsi::JSError jsError) {
    _current = std::make_unique<CppError>(std::move(jsError));
  }

  /**
   Re-publishes an existing `CppError` into the current thread's slot. Used from Swift
   to relay a `CppError` that was caught from a `throw` (and thus already drained from
   the slot by `getCurrent`) so the original `jsi::JSError` — including its stack, code
   and custom properties — can be rethrown into JavaScript.
   */
  inline static void setCurrent(CppError cppError) {
    _current = std::make_unique<CppError>(std::move(cppError));
  }

  /**
   Sets the current thread's error by creating a `jsi::JSError` from the given message.
   Called from Swift when a host function closure throws a plain error.
   */
  inline static void setCurrent(jsi::IRuntime &runtime, const std::string &message) {
    _current = std::make_unique<CppError>(jsi::JSError(runtime, message));
  }

private:
  /**
   Pointer to the last thrown and caught error. Each thread maintains its own
   error pointer, eliminating the need for synchronization and preventing errors
   from one thread affecting another.
   */
  inline static thread_local std::unique_ptr<CppError> _current;

}; // class CppError

} // namespace expo
