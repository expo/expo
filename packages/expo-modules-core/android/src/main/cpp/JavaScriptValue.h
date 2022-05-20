// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JavaScriptObject.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <memory>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {
class JavaScriptRuntime;

/**
 * Represents any JavaScript value. Its purpose is to exposes `jsi::Value` API back to Kotlin.
 */
class JavaScriptValue : public jni::HybridClass<JavaScriptValue> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JavaScriptValue;";
  static auto constexpr TAG = "JavaScriptValue";

  static void registerNatives();

  JavaScriptValue(
    std::weak_ptr<JavaScriptRuntime> runtime,
    std::shared_ptr<jsi::Value> jsValue
  );

  std::string kind();

  bool isNull();
  bool isUndefined();
  bool isBool();
  bool isNumber();
  bool isString();
  bool isSymbol();
  bool isFunction();
  bool isObject();

  bool getBool();
  double getDouble();
  std::string getString();
  jni::local_ref<JavaScriptObject::javaobject> getObject();

private:
  friend HybridBase;
  std::weak_ptr<JavaScriptRuntime> runtimeHolder;
  std::shared_ptr<jsi::Value> jsValue;

  jni::local_ref<jstring> jniKind();
  jni::local_ref<jstring> jniGetString();
};
} // namespace expo
