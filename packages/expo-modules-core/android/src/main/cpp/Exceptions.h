// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <optional>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {

class JSIInteropModuleRegistry;

/**
 * A convenient wrapper for the Kotlin CodedException.
 * It can be used with the `jni::throwNewJavaException` function to throw a cpp exception that
 * will be automatically changed to the corresponding Java/Kotlin exception.
 * `jni::throwNewJavaException` creates and throws a C++ exception which wraps a Java exception,
 * so the C++ flow is interrupted. Then, when translatePendingCppExceptionToJavaException
 * is called at the topmost level of the native stack, the wrapped Java exception is thrown to the java caller.
 */
class CodedException : public jni::JavaClass<CodedException, jni::JThrowable> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/exception/CodedException;";

  static jni::local_ref<CodedException> create(const std::string &message);

  std::string getCode();

  std::optional<std::string> getLocalizedMessage();
};

/**
 * A convenient wrapper for the Kotlin JavaScriptEvaluateException.
 */
class JavaScriptEvaluateException
  : public jni::JavaClass<JavaScriptEvaluateException, CodedException> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/exception/JavaScriptEvaluateException;";

  static jni::local_ref<JavaScriptEvaluateException> create(
    const std::string &message,
    const std::string &jsStack
  );
};

/**
 * A convenient wrapper for the Kotlin UnexpectedException.
 */
class UnexpectedException
  : public jni::JavaClass<UnexpectedException, CodedException> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/exception/UnexpectedException;";

  static jni::local_ref<UnexpectedException> create(
    const std::string &message
  );
};

/**
 * Tries to rethrow an jni::JniException as a js version of the CodedException
 */
[[noreturn]] void rethrowAsCodedError(
  jsi::Runtime &rt,
  JSIInteropModuleRegistry *registry,
  jni::JniException &jniException
);
} // namespace expo
