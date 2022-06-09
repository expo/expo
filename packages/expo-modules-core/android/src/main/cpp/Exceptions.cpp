// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "Exceptions.h"

namespace jni = facebook::jni;

namespace expo {

jni::local_ref<CodedException> CodedException::create(const std::string &message) {
  return CodedException::newInstance(jni::make_jstring(message));
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
} // namespace expo
