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

void rethrowAsCodedError(
  jsi::Runtime &rt,
  JSIInteropModuleRegistry *registry,
  jni::JniException &jniException
) {
  jni::local_ref<jni::JThrowable> unboxedThrowable = jniException.getThrowable();
  if (unboxedThrowable->isInstanceOf(CodedException::javaClassLocal())) {
    auto codedException = jni::static_ref_cast<CodedException>(unboxedThrowable);
    auto code = codedException->getCode();
    auto message = codedException->getLocalizedMessage();

    auto *codedErrorPointer = registry->jsRegistry->getOptionalObject<jsi::Function>(
      JSReferencesCache::JSKeys::CODED_ERROR
    );
    if (codedErrorPointer != nullptr) {
      auto &jsCodedError = *codedErrorPointer;

      throw jsi::JSError(
        message.value_or(""),
        rt,
        jsCodedError.callAsConstructor(
          rt,
          jsi::String::createFromUtf8(rt, code),
          jsi::String::createFromUtf8(rt, message.value_or(""))
        )
      );
    }
  }

  // Rethrow error if we can't wrap it.
  throw;
}
} // namespace expo
