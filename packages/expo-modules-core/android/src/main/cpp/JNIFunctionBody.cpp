// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JNIFunctionBody.h"
#include "CachedReferencesRegistry.h"

namespace jni = facebook::jni;
namespace react = facebook::react;

namespace expo {
jni::local_ref<react::ReadableNativeArray::javaobject>
JNIFunctionBody::invoke(jobjectArray args) {
  // Do NOT use getClass here!
  // Method obtained from `getClass` will point to the overridden version of the method.
  // Because of that, it can't be cached - we will try to invoke the nonexistent method
  // if we receive an object of a different class than the one used to obtain the method id.
  // The only cacheable method id can be obtain from the base class.
  static const auto method = jni::findClassLocal("expo/modules/kotlin/jni/JNIFunctionBody")
    ->getMethod<jni::local_ref<react::ReadableNativeArray::javaobject>(jobjectArray)>(
      "invoke",
      "([Ljava/lang/Object;)Lcom/facebook/react/bridge/ReadableNativeArray;"
    );

  return method(this->self(), args);
}

void JNIAsyncFunctionBody::invoke(
  jobjectArray args,
  jobject promise
) {
  // Do NOT use getClass here!
  // Method obtained from `getClass` will point to the overridden version of the method.
  // Because of that, it can't be cached - we will try to invoke the nonexistent method
  // if we receive an object of a different class than the one used to obtain the method id.
  // The only cacheable method id can be obtain from the base class.
  static const auto method = jni::findClassLocal("expo/modules/kotlin/jni/JNIAsyncFunctionBody")
    ->getMethod<
      void(jobjectArray , jobject)
    >(
      "invoke",
      "([Ljava/lang/Object;Ljava/lang/Object;)V"
    );

  method(this->self(), args, promise);
}
} // namespace expo
