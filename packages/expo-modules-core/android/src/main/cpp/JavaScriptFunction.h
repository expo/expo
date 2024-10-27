// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JSIObjectWrapper.h"
#include "JavaScriptRuntime.h"
#include "WeakRuntimeHolder.h"
#include "types/ExpectedType.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {

class JavaScriptObject;

/**
 * Represents any JavaScript function. Its purpose is to expose the `jsi::Function` API back to Kotlin.
 */
class JavaScriptFunction : public jni::HybridClass<JavaScriptFunction, Destructible>, JSIFunctionWrapper {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JavaScriptFunction;";
  static auto constexpr TAG = "JavaScriptFunction";

  static void registerNatives();

  static jni::local_ref<JavaScriptFunction::javaobject> newInstance(
    JSIContext *jsiContext,
    std::weak_ptr<JavaScriptRuntime> runtime,
    std::shared_ptr<jsi::Function> jsFunction
  );

  JavaScriptFunction(
    std::weak_ptr<JavaScriptRuntime> runtime,
    std::shared_ptr<jsi::Function> jsFunction
  );

  JavaScriptFunction(
    WeakRuntimeHolder runtime,
    std::shared_ptr<jsi::Function> jsFunction
  );

  std::shared_ptr<jsi::Function> get() override;


private:
  friend HybridBase;

  WeakRuntimeHolder runtimeHolder;
  std::shared_ptr<jsi::Function> jsFunction;

  jobject invoke(
    jni::alias_ref<jni::HybridClass<JavaScriptObject, Destructible>::javaobject> jsThis,
    jni::alias_ref<jni::JArrayClass<jni::JObject>> args,
    jni::alias_ref<ExpectedType::javaobject> expectedReturnType
  );
};

} // namespace expo
