// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JavaScriptRuntime.h"
#include "JavaScriptModuleObject.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <ReactCommon/CallInvokerHolder.h>
#include <ReactCommon/CallInvoker.h>

#include <memory>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {
class JSIInteropModuleRegistry : public jni::HybridClass<JSIInteropModuleRegistry> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JSIInteropModuleRegistry;";
  static auto constexpr TAG = "JSIInteropModuleRegistry";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);

  static void registerNatives();

  void installJSI(
    jlong jsRuntimePointer,
    jni::alias_ref<react::CallInvokerHolder::javaobject> jsInvokerHolder,
    jni::alias_ref<react::CallInvokerHolder::javaobject> nativeInvokerHolder
  );

  jni::local_ref<JavaScriptModuleObject::javaobject> getModule(const std::string &moduleName) const;

  std::shared_ptr<react::CallInvoker> jsInvoker;
  std::shared_ptr<react::CallInvoker> nativeInvoker;

private:
  friend HybridBase;
  std::unique_ptr<JavaScriptRuntime> runtimeHolder;
  jni::global_ref<JSIInteropModuleRegistry::javaobject> javaPart_;

  explicit JSIInteropModuleRegistry(jni::alias_ref<jhybridobject> jThis);

  inline jni::local_ref<JavaScriptModuleObject::javaobject>
  callGetJavaScriptModuleObjectMethod(const std::string &moduleName) const;
};
} // namespace expo
