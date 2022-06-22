// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JNIFunctionBody.h"

namespace jni = facebook::jni;
namespace react = facebook::react;

namespace expo {
jni::local_ref<react::ReadableNativeArray::javaobject>
JNIFunctionBody::invoke(jni::local_ref<jni::JArrayClass<jobject>> &&args) {
  static const auto method = getClass()->getMethod<
    react::ReadableNativeArray::javaobject(jni::local_ref<jni::JArrayClass<jobject>>)
  >(
    "invoke"
  );

  return method(this->self(), args);
}

void JNIAsyncFunctionBody::invoke(
  jni::local_ref<jni::JArrayClass<jobject>> &&args,
  jobject promise
) {
  static const auto method = getClass()->getMethod<
    void(jni::local_ref<jni::JArrayClass<jobject>>, jobject)
  >(
    "invoke"
  );

  method(this->self(), args, promise);
}
} // namespace expo
