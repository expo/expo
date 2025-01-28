// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#pragma once

#include "JSIObjectWrapper.h"
#include "JSITypeConverter.h"
#include "JavaScriptRuntime.h"
#include "WeakRuntimeHolder.h"
#include "JNIFunctionBody.h"
#include "JNIDeallocator.h"
#include "JSIUtils.h"

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <memory>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;

namespace expo {

class JavaScriptFunction;
class JavaScriptValue;
class JavaScriptWeakObject;


/**
 * Represents any JavaScript object. Its purpose is to exposes `jsi::Object` API back to Kotlin.
 */
class JavaScriptObject : public jni::HybridClass<JavaScriptObject, Destructible>, JSIObjectWrapper {
public:
  static auto constexpr
    kJavaDescriptor = "Lexpo/modules/kotlin/jni/JavaScriptObject;";
  static auto constexpr TAG = "JavaScriptObject";

  static void registerNatives();

  static jni::local_ref<JavaScriptObject::javaobject> newInstance(
    JSIContext *jsiContext,
    std::weak_ptr<JavaScriptRuntime> runtime,
    std::shared_ptr<jsi::Object> jsObject
  );

  JavaScriptObject(
    std::weak_ptr<JavaScriptRuntime> runtime,
    std::shared_ptr<jsi::Object> jsObject
  );

  JavaScriptObject(
    WeakRuntimeHolder runtime,
    std::shared_ptr<jsi::Object> jsObject
  );

  virtual ~JavaScriptObject() = default;

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

  static jsi::Object preparePropertyDescriptor(jsi::Runtime &jsRuntime, int options);

  void defineNativeDeallocator(
    jni::alias_ref<JNIFunctionBody::javaobject> deallocator
  );

  /**
   * Sets the memory pressure to inform the GC about how much external memory is associated with that specific JS object.
  */
  void setExternalMemoryPressure(int size);

protected:
  WeakRuntimeHolder runtimeHolder;
  std::shared_ptr<jsi::Object> jsObject;

private:
  friend HybridBase;

  bool jniHasProperty(jni::alias_ref<jstring> name);

  jni::local_ref<jni::HybridClass<JavaScriptValue, Destructible>::javaobject> jniGetProperty(
    jni::alias_ref<jstring> name
  );

  jni::local_ref<jni::JArrayClass<jstring>> jniGetPropertyNames();

  jni::local_ref<jni::HybridClass<JavaScriptWeakObject, Destructible>::javaobject> createWeak();

  jni::local_ref<jni::HybridClass<JavaScriptFunction, Destructible>::javaobject> jniAsFunction();

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
    jsi::Runtime &jsRuntime = runtimeHolder.getJSRuntime();

    auto cName = name->toStdString();
    jsObject->setProperty(
      jsRuntime,
      cName.c_str(),
      jsi_type_converter<T>::convert(jsRuntime, value)
    );
  }

  template<
    class T,
    typename = std::enable_if_t<is_jsi_type_converter_defined<T>>
  >
  void defineProperty(jni::alias_ref<jstring> name, T value, int options) {
    jsi::Runtime &jsRuntime = runtimeHolder.getJSRuntime();

    auto cName = name->toStdString();
    jsi::Object descriptor = preparePropertyDescriptor(jsRuntime, options);
    descriptor.setProperty(jsRuntime, "value", jsi_type_converter<T>::convert(jsRuntime, value));
    common::defineProperty(jsRuntime, jsObject.get(), cName.c_str(), std::move(descriptor));
  }
};
} // namespace expo
