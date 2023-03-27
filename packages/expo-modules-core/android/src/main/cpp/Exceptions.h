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

class InvalidArgsNumberException
: public jni::JavaClass<InvalidArgsNumberException, CodedException> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/exception/InvalidArgsNumberException;";

  static jni::local_ref<InvalidArgsNumberException> create(
    int received,
    int expected
  );
};

/**
 * Tries to rethrow an jni::JniException as a js version of the CodedException
 */
[[noreturn]] void rethrowAsCodedError(
  jsi::Runtime &rt,
  jni::JniException &jniException
);

jsi::Value makeCodedError(
  jsi::Runtime &runtime,
  jsi::String code,
  jsi::String message
);

/**
 * fbjni@0.2.2 is built by ndk r21, its exceptions are not catchable by expo-modules-core built by ndk r23+.
 * To catch these excetptions, we copy the `facebook::jni::throwPendingJniExceptionAsCppException` here and throw exceptions on our own.
 */
void throwPendingJniExceptionAsCppException();

/**
 * Same as `facebook::jni::throwNewJavaException` but throwing exceptions on our own.
 */
[[noreturn]] void throwNewJavaException(jthrowable throwable);
} // namespace expo
