// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <memory>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {
class JavaScriptValue;

class JavaScriptRuntime;

/**
 * Represents any JavaScript object. Its purpose is to exposes `jsi::Object` API back to Kotlin.
 */
class JavaScriptObject : public jni::HybridClass<JavaScriptObject> {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JavaScriptObject;";
  static auto constexpr TAG = "JavaScriptObject";

  static void registerNatives();

  JavaScriptObject(
    std::weak_ptr<JavaScriptRuntime> runtime,
    std::shared_ptr<jsi::Object> jsObject
  );

  /**
   * @return a bool whether the object has a property with the given name
   */
  bool hasProperty(const std::string &name);

  /**
   * @return the property of the object with the given name.
   * If the name isn't a property on the object, returns the `jsi::Value::undefined` value.
   */
  jsi::Value getProperty(const std::string &name);

  /**
   * @return a vector consisting of all enumerable property names in the object and its prototype chain.
   */
  std::vector<std::string> getPropertyNames();

private:
  friend HybridBase;
  std::weak_ptr<JavaScriptRuntime> runtimeHolder;
  std::shared_ptr<jsi::Object> jsObject;

  bool jniHasProperty(jni::alias_ref<jstring> name);

  jni::local_ref<jni::HybridClass<JavaScriptValue>::javaobject> jniGetProperty(
    jni::alias_ref<jstring> name
  );

  jni::local_ref<jni::JArrayClass<jstring>> jniGetPropertyNames();
};
}
