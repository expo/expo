// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JavaScriptRuntime.h"
#include "JavaScriptModuleObject.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <memory>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {
class JSIInteropModuleRegistry : public jni::HybridClass<JSIInteropModuleRegistry> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JSIInteropModuleRegistry;";
  static auto constexpr TAG = "JSIInteropModuleRegistry";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);

  static void registerNatives();

  void installJSI(jlong jsRuntimePointer);

  jni::local_ref<JavaScriptModuleObject::javaobject> getModule(const std::string &moduleName) const;

private:
  friend HybridBase;
  std::unique_ptr<JavaScriptRuntime> runtimeHolder;
  jni::global_ref<JSIInteropModuleRegistry::javaobject> javaPart_;

  explicit JSIInteropModuleRegistry(jni::alias_ref<jhybridobject> jThis);

  inline jni::local_ref<JavaScriptModuleObject::javaobject>
  callGetJavaScriptModuleObjectMethod(const std::string &moduleName) const;
};
}
