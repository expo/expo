// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>
#include <folly/dynamic.h>

#include <react/jni/WritableNativeArray.h>
#include <react/jni/WritableNativeMap.h>

namespace jni = facebook::jni;
namespace react = facebook::react;

namespace expo {
class JavaCallback : public jni::HybridClass<JavaCallback> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JavaCallback;";
  static auto constexpr TAG = "JavaCallback";

  static void registerNatives();

private:
  friend HybridBase;

  using Callback = std::function<void(folly::dynamic)>;

  JavaCallback(Callback callback);

  void invoke();

  void invokeBool(bool result);

  void invokeInt(int result);

  void invokeDouble(double result);

  void invokeFloat(float result);

  void invokeString(jni::alias_ref<jstring> result);

  void invokeArray(jni::alias_ref<react::WritableNativeArray::javaobject> result);

  void invokeMap(jni::alias_ref<react::WritableNativeMap::javaobject> result);

  Callback callback;
};
} // namespace expo
