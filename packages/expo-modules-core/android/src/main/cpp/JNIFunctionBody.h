// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>
#include <react/jni/ReadableNativeArray.h>

namespace jni = facebook::jni;
namespace react = facebook::react;

namespace expo {
/**
 * A CPP part of the expo.modules.kotlin.jni.JNIFunctionBody class.
 * It represents the Kotlin's promise-less function.
 */
class JNIFunctionBody : public jni::JavaClass<JNIFunctionBody> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/jni/JNIFunctionBody;";

  /**
   * Invokes a Kotlin's implementation of this function.
   *
   * @param args
   * @return result of the Kotlin function
   */
  static jni::local_ref<jni::JObject> invoke(
    jobject self,
    jobjectArray args
  );
};

/**
 * A CPP part of the expo.modules.kotlin.jni.JNIAsyncFunctionBody class.
 * It represents the Kotlin's promise function.
 */
class JNIAsyncFunctionBody : public jni::JavaClass<JNIAsyncFunctionBody> {
public:
  static auto constexpr kJavaDescriptor = "Lexpo/modules/kotlin/jni/JNIAsyncFunctionBody;";

  /**
   * Invokes a Kotlin's implementation of this async function.
   *
   * @param args
   * @param promise that will be resolve or rejected in the Kotlin's implementation
   */
  static void invoke(
    jobject self,
    jobjectArray args,
    jobject promise
  );
};
} // namespace expo
