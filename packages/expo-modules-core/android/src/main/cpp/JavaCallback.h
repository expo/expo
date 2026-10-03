// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "ExpoHeader.pch"
#include "CallbackContext.h"
#include "JNIDeallocator.h"
#include "JSharedObject.h"
#include "ArrayBuffer.h"
#include "JavaScriptArrayBuffer.h"
#include "NativeArrayBuffer.h"

#include <fbjni/detail/CoreClasses.h>

namespace jni = facebook::jni;
namespace react = facebook::react;
namespace jsi = facebook::jsi;

namespace expo {

class JSIContext;

/**
 * Single-fire callback that settles a JS promise. Resolving or rejecting twice throws.
 */
class JavaCallback : public jni::HybridClass<JavaCallback, Destructible> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JavaCallback;";
  static auto constexpr TAG = "JavaCallback";

  static void registerNatives();

  static jni::local_ref<JavaCallback::javaobject> newInstance(
    JSIContext *jsiContext,
    std::shared_ptr<CallbackContext> callbackContext
  );

private:
  std::weak_ptr<CallbackContext> callbackContext;

  friend HybridBase;

  JavaCallback(std::shared_ptr<CallbackContext> callback);

  void invoke();

  void invokeBool(bool result);

  void invokeInt(int result);

  void invokeDouble(double result);

  void invokeFloat(float result);

  void invokeString(jni::alias_ref<jstring> result);

  void invokeWritableArray(jni::alias_ref<react::WritableNativeArray::javaobject> result);

  void invokeWritableMap(jni::alias_ref<react::WritableNativeMap::javaobject> result);

  void invokeCollection(jni::alias_ref<jni::JCollection<jobject>> result);

  void invokeMap(jni::alias_ref<jni::JMap<jstring, jobject>> result);

  void invokeSharedObject(jni::alias_ref<JSharedObject::javaobject> result);

  void invokeArrayBuffer(jni::alias_ref<ArrayBuffer::javaobject> result);

  void invokeJavaScriptArrayBuffer(jni::alias_ref<JavaScriptArrayBuffer::javaobject> result);

  void invokeNativeArrayBuffer(jni::alias_ref<NativeArrayBuffer::javaobject> result);

  void invokeError(jni::alias_ref<jstring> code, jni::alias_ref<jstring> errorMessage);

  void invokeIntArray(jni::alias_ref<jni::JArrayInt> result);
  void invokeLongArray(jni::alias_ref<jni::JArrayLong> result);
  void invokeDoubleArray(jni::alias_ref<jni::JArrayDouble> result);
  void invokeFloatArray(jni::alias_ref<jni::JArrayFloat> result);

  void invokeWithResolver(std::function<void(jsi::Runtime &rt, jsi::Function &jsFunction)> resolver);

  template<class T>
  void invokeJSFunctionForArray(T &arg);
};
} // namespace expo
