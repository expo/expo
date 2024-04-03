// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JNIDeallocator.h"

#include <jsi/jsi.h>
#include <fbjni/fbjni.h>
#include <folly/dynamic.h>
#include <variant>

#include <react/jni/WritableNativeArray.h>
#include <react/jni/WritableNativeMap.h>
#include <fbjni/detail/CoreClasses.h>
#include <ReactCommon/CallInvoker.h>

namespace jni = facebook::jni;
namespace react = facebook::react;
namespace jsi = facebook::jsi;

namespace expo {

struct SharedRef : public jni::JavaClass<SharedRef> {
  static constexpr const char *kJavaDescriptor = "Lexpo/modules/kotlin/sharedobjects/SharedRef;";
};

class JSIContext;

typedef std::variant<folly::dynamic, jni::global_ref<SharedRef::javaobject>> CallbackArg;

class JavaCallback : public jni::HybridClass<JavaCallback, Destructible> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JavaCallback;";
  static auto constexpr TAG = "JavaCallback";

  struct CallbackContext {
    jsi::Runtime &rt;
    std::shared_ptr<react::CallInvoker> jsCallInvokerHolder;
    std::optional<jsi::Function> jsFunctionHolder;
    bool isRejectCallback;
  };

  static void registerNatives();

  static jni::local_ref<JavaCallback::javaobject> newInstance(
    JSIContext *jsiContext,
    std::shared_ptr<CallbackContext> callbackContext
  );

private:
  std::shared_ptr<CallbackContext> callbackContext;

  friend HybridBase;


  JavaCallback(std::shared_ptr<CallbackContext> callback);

  void invoke();

  void invokeBool(bool result);

  void invokeInt(int result);

  void invokeDouble(double result);

  void invokeFloat(float result);

  void invokeString(jni::alias_ref<jstring> result);

  void invokeArray(jni::alias_ref<react::WritableNativeArray::javaobject> result);

  void invokeMap(jni::alias_ref<react::WritableNativeMap::javaobject> result);

  void invokeSharedRef(jni::alias_ref<SharedRef::javaobject> result);

  template<class T>
  using ArgsConverter = std::function<void(
    jsi::Runtime &rt,
    jsi::Function &jsFunction,
    T arg,
    bool isRejectCallback
  )>;

  template<class T>
  inline void invokeJSFunction(
    ArgsConverter<T> argsConverter,
    T arg
  );

  template<class T>
  inline void invokeJSFunction(T arg);
};
} // namespace expo
