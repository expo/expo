// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JSIObjectWrapper.h"
#include "JSITypeConverter.h"
#include "JavaScriptRuntime.h"

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
class JavaScriptObject : public jni::HybridClass<JavaScriptObject>, JSIObjectWrapper {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JavaScriptObject;";
  static auto constexpr TAG = "JavaScriptObject";

  static void registerNatives();

  JavaScriptObject(
    std::weak_ptr<JavaScriptRuntime> runtime,
    std::shared_ptr<jsi::Object> jsObject
  );

  std::shared_ptr<jsi::Object> get() override;

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

  void setProperty(const std::string &name, jsi::Value value);

private:
  friend HybridBase;
  std::weak_ptr<JavaScriptRuntime> runtimeHolder;
  std::shared_ptr<jsi::Object> jsObject;

  bool jniHasProperty(jni::alias_ref<jstring> name);

  jni::local_ref<jni::HybridClass<JavaScriptValue>::javaobject> jniGetProperty(
    jni::alias_ref<jstring> name
  );

  jni::local_ref<jni::JArrayClass<jstring>> jniGetPropertyNames();

  /**
   * Unsets property with the given name.
   */
  void unsetProperty(jni::alias_ref<jstring> name);

  /**
   * A template to generate different versions of the `setProperty` method based on the `jsi_type_converter` trait.
   * Those generated methods will be exported and visible in the Kotlin codebase.
   * On the other hand, we could just make one function that would take a generic Java Object,
   * but then we would have to decide what to do with it and how to convert it to jsi::Value
   * in cpp. That would be expensive. So it's easier to ensure that
   * we call the correct version of `setProperty` in the Kotlin code.
   *
   * This template will work only if the jsi_type_converter exists for a given type.
   */
  template<
    class T,
    typename = std::enable_if_t<is_jsi_type_converter_defined<T>>
  >
  void setProperty(jni::alias_ref<jstring> name, T value) {
    auto runtime = runtimeHolder.lock();
    assert(runtime != nullptr);
    auto cName = name->toStdString();

    jsObject->setProperty(
      *runtime->get(),
      cName.c_str(),
      jsi_type_converter<T>::convert(*runtime->get(), value)
    );
  }

  template<
    class T,
    typename = std::enable_if_t<is_jsi_type_converter_defined<T>>
  >
  void defineProperty(jni::alias_ref<jstring> name, T value, int options) {
    auto runtime = runtimeHolder.lock();
    assert(runtime != nullptr);
    jsi::Runtime &jsRuntime = *runtime->get();

    auto cName = name->toStdString();
    jsi::Object global = jsRuntime.global();
    jsi::Object objectClass = global.getPropertyAsObject(jsRuntime, "Object");
    jsi::Function definePropertyFunction = objectClass.getPropertyAsFunction(
      jsRuntime,
      "defineProperty"
    );
    jsi::Object descriptor = preparePropertyDescriptor(jsRuntime, options);

    descriptor.setProperty(jsRuntime, "value", jsi_type_converter<T>::convert(jsRuntime, value));

    definePropertyFunction.callWithThis(jsRuntime, objectClass, {
      jsi::Value(jsRuntime, *jsObject),
      jsi::String::createFromUtf8(jsRuntime, cName),
      std::move(descriptor)
    });
  }

  static jsi::Object preparePropertyDescriptor(jsi::Runtime &jsRuntime, int options);
};
} // namespace expo
