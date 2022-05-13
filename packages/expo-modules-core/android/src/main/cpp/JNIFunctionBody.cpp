// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JNIFunctionBody.h"

namespace jni = facebook::jni;
namespace react = facebook::react;

namespace expo {
jni::local_ref<react::ReadableNativeArray::javaobject>
JNIFunctionBody::invoke(react::ReadableNativeArray::javaobject &&args) {
  static const auto method = getClass()->getMethod<react::ReadableNativeArray::javaobject(
    react::ReadableNativeArray::javaobject)>(
    "invoke"
  );

  return method(this->self(), args);
}

void JNIAsyncFunctionBody::invoke(react::ReadableNativeArray::javaobject &&args, jobject promise) {
  static const auto method = getClass()->getMethod<react::ReadableNativeArray::javaobject(
    react::ReadableNativeArray::javaobject,
    jobject)>(
    "invoke"
  );

  method(this->self(), args, promise);
}
} // namespace expo
