// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptObject.h"
#include "JavaScriptValue.h"
#include "JavaScriptFunction.h"
#include "JavaScriptRuntime.h"
#include "JavaScriptWeakObject.h"
#include "JSITypeConverter.h"
#include "ObjectDeallocator.h"
#include "JavaReferencesCache.h"
#include "JSIInteropModuleRegistry.h"

namespace expo {
void JavaScriptObject::registerNatives() {
  registerHybrid({
                   makeNativeMethod("hasProperty", JavaScriptObject::jniHasProperty),
                   makeNativeMethod("getProperty", JavaScriptObject::jniGetProperty),
                   makeNativeMethod("getPropertyNames", JavaScriptObject::jniGetPropertyNames),
                   makeNativeMethod("createWeak", JavaScriptObject::createWeak),
                   makeNativeMethod("setBoolProperty", JavaScriptObject::setProperty<bool>),
                   makeNativeMethod("setDoubleProperty", JavaScriptObject::setProperty<double>),
                   makeNativeMethod("setStringProperty",
                                    JavaScriptObject::setProperty<jni::alias_ref<jstring>>),
                   makeNativeMethod("setJSValueProperty",
                                    JavaScriptObject::setProperty<jni::alias_ref<JavaScriptValue::javaobject>>),
                   makeNativeMethod("setJSObjectProperty",
                                    JavaScriptObject::setProperty<jni::alias_ref<JavaScriptObject::javaobject>>),
                   makeNativeMethod("unsetProperty", JavaScriptObject::unsetProperty),
                   makeNativeMethod("defineBoolProperty", JavaScriptObject::defineProperty<bool>),
                   makeNativeMethod("defineDoubleProperty",
                                    JavaScriptObject::defineProperty<double>),
                   makeNativeMethod("defineStringProperty",
                                    JavaScriptObject::defineProperty<jni::alias_ref<jstring>>),
                   makeNativeMethod("defineJSValueProperty",
                                    JavaScriptObject::defineProperty<jni::alias_ref<JavaScriptValue::javaobject>>),
                   makeNativeMethod("defineJSObjectProperty",
                                    JavaScriptObject::defineProperty<jni::alias_ref<JavaScriptObject::javaobject>>),
                   makeNativeMethod("defineNativeDeallocator",
                                    JavaScriptObject::defineNativeDeallocator),
                 });
}

JavaScriptObject::JavaScriptObject(
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::Object> jsObject
) : runtimeHolder(std::move(runtime)), jsObject(std::move(jsObject)) {
  runtimeHolder.ensureRuntimeIsValid();
}

JavaScriptObject::JavaScriptObject(
  WeakRuntimeHolder runtime,
  std::shared_ptr<jsi::Object> jsObject
) : runtimeHolder(std::move(runtime)), jsObject(std::move(jsObject)) {
  runtimeHolder.ensureRuntimeIsValid();
}

std::shared_ptr<jsi::Object> JavaScriptObject::get() {
  return jsObject;
}

bool JavaScriptObject::hasProperty(const std::string &name) {
  auto &jsRuntime = runtimeHolder.getJSRuntime();
  return jsObject->hasProperty(jsRuntime, name.c_str());
}

jsi::Value JavaScriptObject::getProperty(const std::string &name) {
  auto &jsRuntime = runtimeHolder.getJSRuntime();
  return jsObject->getProperty(jsRuntime, name.c_str());
}

bool JavaScriptObject::jniHasProperty(jni::alias_ref<jstring> name) {
  return hasProperty(name->toStdString());
}

jni::local_ref<JavaScriptValue::javaobject> JavaScriptObject::jniGetProperty(
  jni::alias_ref<jstring> name
) {
  auto result = std::make_shared<jsi::Value>(getProperty(name->toStdString()));
  return JavaScriptValue::newInstance(
    runtimeHolder.getModuleRegistry(),
    runtimeHolder,
    result
  );
}

std::vector<std::string> JavaScriptObject::getPropertyNames() {
  auto &jsRuntime = runtimeHolder.getJSRuntime();

  jsi::Array properties = jsObject->getPropertyNames(jsRuntime);
  auto size = properties.size(jsRuntime);

  std::vector<std::string> names(size);
  for (size_t i = 0; i < size; i++) {
    auto propertyName = properties
      .getValueAtIndex(jsRuntime, i)
      .asString(jsRuntime)
      .utf8(jsRuntime);
    names[i] = propertyName;
  }

  return names;
}

jni::local_ref<jni::JArrayClass<jstring>> JavaScriptObject::jniGetPropertyNames() {
  std::vector<std::string> cResult = getPropertyNames();
  auto paredResult = jni::JArrayClass<jstring>::newArray(cResult.size());
  for (size_t i = 0; i < cResult.size(); i++) {
    paredResult->setElement(i, jni::make_jstring(cResult[i]).get());
  }

  return paredResult;
}

jni::local_ref<jni::HybridClass<JavaScriptWeakObject, Destructible>::javaobject> JavaScriptObject::createWeak() {
  return JavaScriptWeakObject::newInstance(
    runtimeHolder.getModuleRegistry(),
    runtimeHolder,
    get()
  );
}

jni::local_ref<JavaScriptFunction::javaobject> JavaScriptObject::jniAsFunction() {
  auto &jsRuntime = runtimeHolder.getJSRuntime();
  auto jsFuncion = std::make_shared<jsi::Function>(jsObject->asFunction(jsRuntime));
  return JavaScriptFunction::newInstance(
    runtimeHolder.getModuleRegistry(),
    runtimeHolder,
    jsFuncion
  );
}

void JavaScriptObject::setProperty(const std::string &name, jsi::Value value) {
  auto &jsRuntime = runtimeHolder.getJSRuntime();
  jsObject->setProperty(jsRuntime, name.c_str(), value);
}

void JavaScriptObject::unsetProperty(jni::alias_ref<jstring> name) {
  auto &jsRuntime = runtimeHolder.getJSRuntime();
  auto cName = name->toStdString();
  jsObject->setProperty(
    jsRuntime,
    cName.c_str(),
    jsi::Value::undefined()
  );
}

jsi::Object JavaScriptObject::preparePropertyDescriptor(
  jsi::Runtime &jsRuntime,
  int options
) {
  jsi::Object descriptor(jsRuntime);
  descriptor.setProperty(jsRuntime, "configurable", (bool) ((1 << 0) & options));
  descriptor.setProperty(jsRuntime, "enumerable", (bool) ((1 << 1) & options));
  if ((bool) (1 << 2 & options)) {
    descriptor.setProperty(jsRuntime, "writable", true);
  }
  return descriptor;
}

jni::local_ref<JavaScriptObject::javaobject> JavaScriptObject::newInstance(
  JSIInteropModuleRegistry *jsiInteropModuleRegistry,
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::Object> jsObject
) {
  auto object = JavaScriptObject::newObjectCxxArgs(std::move(runtime), std::move(jsObject));
  jsiInteropModuleRegistry->jniDeallocator->addReference(object);
  return object;
}

void JavaScriptObject::defineNativeDeallocator(
  jni::alias_ref<JNIFunctionBody::javaobject> deallocator
) {
  auto &rt = runtimeHolder.getJSRuntime();
  jni::global_ref<JNIFunctionBody::javaobject> globalRef = jni::make_global(deallocator);

  common::setDeallocator(
    rt,
    jsObject,
    [globalRef = std::move(globalRef)]() mutable {
      auto args = jni::Environment::ensureCurrentThreadIsAttached()->NewObjectArray(
        0,
        JavaReferencesCache::instance()->getJClass("java/lang/Object").clazz,
        nullptr
      );
      globalRef->invoke(args);
      globalRef.reset();
    },
    "__expo_shared_object_deallocator__"
  );
}
} // namespace expo
