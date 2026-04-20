// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JNIDeallocator.h"
#include "JavaScriptRuntime.h"

#include <jsi/jsi.h>
#include <fbjni/fbjni.h>
#include <ReactCommon/CallInvoker.h>
#include <react/bridging/LongLivedObject.h>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {

class JSIContext;

/**
 * A multi-fire async callback that safely invokes a JavaScript function
 * from any native thread.
 */
class JSCallback : public jni::HybridClass<JSCallback, Destructible> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JSCallback;";
  static auto constexpr TAG = "JSCallback";

  /**
   * Context holding the JS function and invoker references.
   */
  class CallbackContext : public react::LongLivedObject {
  public:
    CallbackContext(
      jsi::Runtime &rt,
      std::weak_ptr<react::CallInvoker> jsCallInvokerHolder,
      std::shared_ptr<jsi::Function> jsFunction
    );

    jsi::Runtime &rt;
    std::weak_ptr<react::CallInvoker> jsCallInvokerHolder;
    std::shared_ptr<jsi::Function> jsFunction;

    void release();
  };

  static void registerNatives();

  static jni::local_ref<JSCallback::javaobject> newInstance(
    JSIContext *jsiContext,
    const std::shared_ptr<CallbackContext>& callbackContext
  );

  ~JSCallback() override;

private:
  std::weak_ptr<CallbackContext> callbackContext;

  friend HybridBase;

  JSCallback(const std::shared_ptr<CallbackContext>& callbackContext);

  void invoke();

  void invokeBool(bool result);
  void invokeInt(int result);
  void invokeDouble(double result);
  void invokeFloat(float result);
  void invokeString(jni::alias_ref<jstring> result);
  void invokeCollection(const jni::alias_ref<jni::JCollection<jobject>>& result);
  void invokeMap(const jni::alias_ref<jni::JMap<jstring, jobject>>& result);

  void invokeIntArray(jni::alias_ref<jni::JArrayInt> result);
  void invokeLongArray(jni::alias_ref<jni::JArrayLong> result);
  void invokeDoubleArray(jni::alias_ref<jni::JArrayDouble> result);
  void invokeFloatArray(jni::alias_ref<jni::JArrayFloat> result);

  template<class T>
  using ArgsConverter = std::function<void(jsi::Runtime &rt, jsi::Function &jsFunction, T arg)>;

  template<class T>
  void invokeJSFunction(
    ArgsConverter<typename std::remove_const<T>::type> argsConverter,
    T arg
  );

  template<class T>
  void invokeJSFunctionForArray(T &arg);

  template<class T>
  void invokeJSFunction(T arg);
};

} // namespace expo
