// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JavaScriptRuntime.h"
#include "JavaScriptModuleObject.h"
#include "JavaScriptValue.h"
#include "JavaScriptObject.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <ReactCommon/CallInvokerHolder.h>
#include <ReactCommon/CallInvoker.h>

#include <memory>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {
/**
 * A JNI wrapper to initialize CPP part of modules and access all data from the module registry.
 */
class JSIInteropModuleRegistry : public jni::HybridClass<JSIInteropModuleRegistry> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JSIInteropModuleRegistry;";
  static auto constexpr TAG = "JSIInteropModuleRegistry";

  static jni::local_ref<jhybriddata> initHybrid(jni::alias_ref<jhybridobject> jThis);

  static void registerNatives();

  /**
   * Initializes the `ExpoModulesHostObject` and adds it to the global object.
   */
  void installJSI(
    jlong jsRuntimePointer,
    jni::alias_ref<react::CallInvokerHolder::javaobject> jsInvokerHolder,
    jni::alias_ref<react::CallInvokerHolder::javaobject> nativeInvokerHolder
  );

  /**
   * Initializes the test runtime. Shouldn't be used in the production.
   */
  void installJSIForTests();

  /**
   * Gets a module for a given name. It will throw an exception if the module doesn't exist.
   *
   * @param moduleName
   * @return An instance of `JavaScriptModuleObject`
   */
  jni::local_ref<JavaScriptModuleObject::javaobject> getModule(const std::string &moduleName) const;

  /**
   * Exposes a `JavaScriptRuntime::evaluateScript` function to Kotlin
   */
  jni::local_ref<JavaScriptValue::javaobject> evaluateScript(jni::JString script);

  /**
   * Exposes a `JavaScriptRuntime::global` function to Kotlin
   */
  jni::local_ref<JavaScriptObject::javaobject> global();

  std::shared_ptr<react::CallInvoker> jsInvoker;
  std::shared_ptr<react::CallInvoker> nativeInvoker;

private:
  friend HybridBase;
  std::shared_ptr<JavaScriptRuntime> runtimeHolder;
  jni::global_ref<JSIInteropModuleRegistry::javaobject> javaPart_;

  explicit JSIInteropModuleRegistry(jni::alias_ref<jhybridobject> jThis);

  inline jni::local_ref<JavaScriptModuleObject::javaobject>
  callGetJavaScriptModuleObjectMethod(const std::string &moduleName) const;
};
} // namespace expo
