#pragma once

#include <exception>
#include <memory>
#include <swift/bridging>
#include <jsi/jsi.h>

namespace expo {

namespace jsi = facebook::jsi;

/**
 A thread-safe error handling class for capturing and propagating C++ exceptions
 across the C++/Swift boundary when working with JavaScript runtimes.

 This class provides a mechanism to catch exceptions thrown during JavaScript
 operations and store them in thread-local storage, allowing Swift code to
 retrieve and handle errors after calling C++ functions.

 ## Thread Safety
 Each thread maintains its own error state using thread-local storage, making
 this class safe to use across multiple threads without synchronization overhead.
 */
class CppError {
public:
  /**
   Creates a CppError with a custom error message describing what went wrong.
   */
  CppError(const std::string message) : message(message) {}
  
  /**
   Creates a CppError from a JavaScript error.
   */
  CppError(jsi::JSError jsError) : message(jsError.getMessage()) {}
  
  /**
   Creates a CppError from a JSI exception.
   */
  CppError(jsi::JSIException jsiException) : message(jsiException.what()) {}

  /**
   The error message describing what went wrong.
   */
  std::string message SWIFT_NAME(_message);

  /**
   Converts this error into a JavaScript value that can be thrown or returned to JavaScript.
   */
  const jsi::Value asValue(jsi::Runtime &runtime) noexcept {
    return jsi::Value(runtime, jsi::String::createFromUtf8(runtime, message));
  }

  /**
   Executes a block of code and catches any C++ exceptions that are thrown.
   If an exception is caught, it's stored in thread-local storage and can be
   retrieved using `getCurrent()`. The function returns `nullptr` when an
   exception occurs.

   Catches the following exception types:
   - `jsi::JSError` - JavaScript runtime errors
   - `jsi::JSIException` - JSI-specific exceptions
   - `...` - All other C++ exceptions (reported as "Unknown C++ error")

   @tparam Result The return type of the block. Must be a pointer or nullable type.
   @param block A block to execute within the try-catch wrapper.
   @return The result of the block if successful, or `nullptr` if an exception occurred.

   ## Example
   ```cpp
   jsi::Value result = CppError::tryCatch(^{
     return function.call(runtime, args, count);
   });

   if (result.isNull()) {
     // An error occurred, check getCurrent()
   }
   ```
   */
  template <typename Result>
  inline static Result tryCatch(Result(^block)(void)) {
    try {
      return block();
    } catch (jsi::JSError &e) {
      _current = std::make_unique<CppError>(e);
    } catch (jsi::JSIException &e) {
      _current = std::make_unique<CppError>(e);
    } catch (...) {
      _current = std::make_unique<CppError>("Unknown C++ error");
    }
    return nullptr;
  }

  /**
   Retrieves the current thread's error and transfers ownership to the caller.
   After calling this method, the thread-local error state is reset to `nullptr`, and the caller becomes responsible for deleting the returned pointer.

   @return A pointer to the current error, or `nullptr` if no error exists. The caller must delete this pointer when done.

   ## Important
   - This method transfers ownership of the error to the caller
   - The caller must delete the returned pointer to avoid memory leaks
   - Each thread has its own independent error state
   - Calling this method resets the current thread's error state

   ## Example
   ```cpp
   CppError* error = CppError::getCurrent();
   if (error) {
     std::string msg = error->message;
     delete error; // Don't forget to clean up!
   }
   ```
   */
  inline static CppError* getCurrent() {
    if (!_current) {
      return nullptr;
    }
    return _current.release();
  }

private:
  /**
   Pointer to the last thrown and caught error. Each thread maintains its own error pointer,
   eliminating the need for synchronization and preventing errors from one thread affecting another.
   */
  inline static thread_local std::unique_ptr<CppError> _current;

}; // class CppError

} // namespace expo
