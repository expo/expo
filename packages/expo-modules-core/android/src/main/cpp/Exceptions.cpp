// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "Exceptions.h"

#include "JSIInteropModuleRegistry.h"
#include "JSReferencesCache.h"

namespace jni = facebook::jni;

namespace expo {

jni::local_ref<CodedException> CodedException::create(const std::string &message) {
  return CodedException::newInstance(jni::make_jstring(message));
}

std::string CodedException::getCode() {
  const auto getCode = this->getClass()->getMethod<jni::JString()>("getCode");
  const auto code = getCode(this->self());
  return code->toStdString();
}

std::optional<std::string> CodedException::getLocalizedMessage() {
  const auto getLocalizedMessage = this->getClass()
    ->getMethod<jni::JString()>("getLocalizedMessage");
  const auto message = getLocalizedMessage(this->self());
  if (message != nullptr) {
    return message->toStdString();
  }

  return std::nullopt;
}

jni::local_ref<JavaScriptEvaluateException> JavaScriptEvaluateException::create(
  const std::string &message,
  const std::string &jsStack
) {
  return JavaScriptEvaluateException::newInstance(
    jni::make_jstring(message),
    jni::make_jstring(jsStack)
  );
}

jni::local_ref<UnexpectedException> UnexpectedException::create(const std::string &message) {
  return UnexpectedException::newInstance(
    jni::make_jstring(message)
  );
}

jsi::Value makeCodedError(
  jsi::Runtime &rt,
  jsi::String code,
  jsi::String message
) {
  auto codedErrorConstructor = rt
    .global()
    .getProperty(rt, "ExpoModulesCore_CodedError")
    .asObject(rt)
    .asFunction(rt);

  return codedErrorConstructor.callAsConstructor(
    rt, {
      jsi::Value(rt, code),
      jsi::Value(rt, message)
    }
  );
}

void rethrowAsCodedError(
  jsi::Runtime &rt,
  jni::JniException &jniException
) {
  jni::local_ref<jni::JThrowable> unboxedThrowable = jniException.getThrowable();
  if (unboxedThrowable->isInstanceOf(CodedException::javaClassLocal())) {
    auto codedException = jni::static_ref_cast<CodedException>(unboxedThrowable);
    auto code = codedException->getCode();
    auto message = codedException->getLocalizedMessage();

    auto codedError = makeCodedError(
      rt,
      jsi::String::createFromUtf8(rt, code),
      jsi::String::createFromUtf8(rt, message.value_or(""))
    );

    throw jsi::JSError(
      message.value_or(""),
      rt,
      std::move(codedError)
    );
  }

  // Rethrow error if we can't wrap it.
  throw;
}

void throwPendingJniExceptionAsCppException() {
  JNIEnv* env = jni::Environment::current();
  if (env->ExceptionCheck() == JNI_FALSE) {
    return;
  }

  auto throwable = env->ExceptionOccurred();
  if (!throwable) {
    throw std::runtime_error("Unable to get pending JNI exception.");
  }
  env->ExceptionClear();

  throw jni::JniException(jni::adopt_local(throwable));
}

void throwNewJavaException(jthrowable throwable) {
  throw jni::JniException(jni::wrap_alias(throwable));
}

} // namespace expo
