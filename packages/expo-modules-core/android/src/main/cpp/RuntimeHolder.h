// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "ExpoHeader.pch"
#include "ArrayBuffer.h"
#include "JSHeapAccessExecutorHolder.h"

#include <ReactCommon/CallInvokerHolder.h>
#include <ReactCommon/CallInvoker.h>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

class RuntimeHolder : public jni::HybridClass<RuntimeHolder> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/tests/RuntimeHolder;";
  static auto constexpr TAG = "RuntimeHolder";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);

  static void registerNatives();

  jlong createRuntime();

  void release();

  jni::local_ref<react::CallInvokerHolder::javaobject> createCallInvoker();

  void accessExpiredJavaScriptBackedArrayBuffer(
    jni::alias_ref<JSHeapAccessExecutorJavaClass::javaobject> executor
  );

  void accessExpiredJavaScriptBackedArrayBufferAsync(
    jni::alias_ref<JSHeapAccessExecutorJavaClass::javaobject> executor,
    jni::alias_ref<JNIFunctionBody::javaobject> body,
    jni::alias_ref<ArrayBufferScopedAccessAsyncCallback::javaobject> callback,
    jni::alias_ref<ArrayBufferScopedAccessAsyncQueueFailureCallback::javaobject> queueFailureCallback
  );

private:
  friend HybridBase;

  std::shared_ptr<jsi::Runtime> runtime;
};

} // namespace expo
