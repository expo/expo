// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JSIObjectWrapper.h"
#include "WeakRuntimeHolder.h"
#include "JavaScriptTypedArray.h"
#include "JNIDeallocator.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <memory>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {
class JavaScriptRuntime;

class JavaScriptObject;

class JavaScriptTypedArray;

class JavaScriptFunction;

/**
 * Represents any JavaScript value. Its purpose is to expose the `jsi::Value` API back to Kotlin.
 */
class JavaScriptValue : public jni::HybridClass<JavaScriptValue, Destructible>, JSIValueWrapper {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JavaScriptValue;";
  static auto constexpr TAG = "JavaScriptValue";

  static void registerNatives();

  static jni::local_ref<JavaScriptValue::javaobject> newInstance(
    JSIInteropModuleRegistry *jsiInteropModuleRegistry,
    std::weak_ptr<JavaScriptRuntime> runtime,
    std::shared_ptr<jsi::Value> jsValue
  );

  JavaScriptValue(
    std::weak_ptr<JavaScriptRuntime> runtime,
    std::shared_ptr<jsi::Value> jsValue
  );

  JavaScriptValue(
    WeakRuntimeHolder runtime,
    std::shared_ptr<jsi::Value> jsValue
  );

  std::shared_ptr<jsi::Value> get() override;

  std::string kind();

  bool isNull();

  bool isUndefined();

  bool isBool();

  bool isNumber();

  bool isString();

  bool isSymbol();

  bool isFunction();

  bool isArray();

  bool isObject();

  bool isTypedArray();

  bool getBool();

  double getDouble();

  std::string getString();

  jni::local_ref<jni::HybridClass<JavaScriptObject, Destructible>::javaobject> getObject();

  jni::local_ref<jni::JArrayClass<JavaScriptValue::javaobject>> getArray();

  jni::local_ref<JavaScriptTypedArray::javaobject> getTypedArray();

  jni::local_ref<jni::HybridClass<JavaScriptFunction, Destructible>::javaobject> jniGetFunction();

private:
  friend HybridBase;

  WeakRuntimeHolder runtimeHolder;
  std::shared_ptr<jsi::Value> jsValue;

  jni::local_ref<jstring> jniKind();

  jni::local_ref<jstring> jniGetString();
};
} // namespace expo
