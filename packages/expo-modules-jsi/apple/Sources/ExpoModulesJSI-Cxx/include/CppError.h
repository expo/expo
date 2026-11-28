#pragma once

#include <cassert>
#include <exception>
#include <optional>
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
   Executes a C++ callable and catches any C++ exceptions that are thrown.
   Caught exceptions are stored in thread-local storage and can be checked with
   `hasCurrent()` and retrieved using `takeCurrent()`. The function returns
   `nullptr` when an exception occurs.

   Takes a forwarding reference to a C++ callable (e.g. a lambda) rather than an
   Objective-C block. Every caller passes a pure C++ body, so no Swift closure
   crosses this boundary; the block only added a non-inlinable indirect call and
   a dependency on the Objective-C runtime. This helper is C++-only and is not
   imported into Swift.
   */
  template <typename Fn>
  inline static auto tryCatch(jsi::IRuntime &runtime, Fn &&block) -> decltype(block()) {
    try {
      return block();
    } catch (...) {
      storeCaughtException(runtime);
    }
    return nullptr;
  }

  /**
   Like `tryCatch`, for a callable that returns nothing. Returns `false` when an exception was caught
   and stored, so the caller reads the thread-local error only after a failure.
   */
  template <typename Fn>
  inline static bool tryCatchSucceeded(jsi::IRuntime &runtime, Fn &&block) {
    try {
      block();
      return true;
    } catch (...) {
      storeCaughtException(runtime);
    }
    return false;
  }

  /**
   Returns whether the current thread has a pending error.
   */
  inline static bool hasCurrent() noexcept {
    return _current.has_value();
  }

  /**
   Moves the current thread's pending error out and clears the thread-local slot.
   Must only be called when `hasCurrent()` is `true`.
   */
  inline static CppError takeCurrent() {
    assert(_current.has_value());
    CppError error(std::move(*_current));
    _current.reset();
    return error;
  }

  /**
   Drains the current thread's pending error (if any) and rethrows its `jsi::JSError`.
   */
  inline static void rethrowCurrent() {
    if (_current.has_value()) {
      jsi::JSError error = std::move(*_current);
      _current.reset();
      throw std::move(error);
    }
  }

  /**
   Sets the current thread's error from a pre-built `jsi::JSError`.
   Called from Swift when a host function closure throws a JavaScriptThrowable error.
   */
  inline static void setCurrent(jsi::JSError jsError) {
    _current.emplace(std::move(jsError));
  }

  /**
   Re-publishes an existing `CppError` into the current thread's slot. Used from Swift
   to relay a `CppError` that was caught from a `throw` (and thus already drained from
   the slot by `takeCurrent`) so the original `jsi::JSError` — including its stack, code
   and custom properties — can be rethrown into JavaScript.
   */
  inline static void setCurrent(CppError cppError) {
    _current.emplace(std::move(cppError.jsError));
  }

  /**
   Sets the current thread's error by creating a `jsi::JSError` from the given message.
   Called from Swift when a host function closure throws a plain error.
   */
  inline static void setCurrent(jsi::IRuntime &runtime, const std::string &message) {
    _current.emplace(runtime, message);
  }

private:
  /**
   Stores the exception that is being handled as the current thread's error. Must be called from
   a `catch` block.
   */
  inline static void storeCaughtException(jsi::IRuntime &runtime) {
    try {
      throw;
    } catch (jsi::JSError &e) {
      _current.emplace(std::move(e));
    } catch (const std::exception &e) {
      _current.emplace(runtime, e.what());
    } catch (...) {
      _current.emplace(runtime, "Unknown C++ error");
    }
  }

  /**
   The last thrown and caught error. Each thread maintains its own slot,
   eliminating the need for synchronization and preventing errors from one
   thread affecting another.
   */
  inline static thread_local std::optional<jsi::JSError> _current;

}; // class CppError

} // namespace expo
