// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptObject.h"
#include "JavaScriptValue.h"
#include "JavaScriptFunction.h"
#include "JavaScriptRuntime.h"
#include "JavaScriptWeakObject.h"
#include "JSITypeConverter.h"
#include "ObjectDeallocator.h"
#include "JavaReferencesCache.h"
#include "JSIContext.h"
#include "JavaScriptArrayBuffer.h"

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
                   makeNativeMethod("setExternalMemoryPressure",
                                    JavaScriptObject::setExternalMemoryPressure),
                   makeNativeMethod("isArray", JavaScriptObject::isArray),
                   makeNativeMethod("getArray", JavaScriptObject::getArray),
                   makeNativeMethod("isArrayBuffer", JavaScriptObject::isArrayBuffer),
                   makeNativeMethod("getArrayBuffer", JavaScriptObject::getArrayBuffer),
                 });
}

JavaScriptObject::JavaScriptObject(
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::Object> jsObject
) : runtimeHolder(std::move(runtime)), jsObject(std::move(jsObject)) {
  assert((!runtimeHolder.expired()) && "JS Runtime was used after deallocation");
}

std::shared_ptr<jsi::Object> JavaScriptObject::get() {
  return jsObject;
}

bool JavaScriptObject::hasProperty(const std::string &name) {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  return jsObject->hasProperty(rawRuntime, name.c_str());
}

jsi::Value JavaScriptObject::getProperty(const std::string &name) {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  return jsObject->getProperty(rawRuntime, name.c_str());
}

bool JavaScriptObject::jniHasProperty(jni::alias_ref<jstring> name) {
  return hasProperty(name->toStdString());
}

jni::local_ref<JavaScriptValue::javaobject> JavaScriptObject::jniGetProperty(
  jni::alias_ref<jstring> name
) {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  auto result = std::make_shared<jsi::Value>(getProperty(name->toStdString()));
  return JavaScriptValue::newInstance(
    expo::getJSIContext(rawRuntime),
    runtimeHolder,
    result
  );
}

std::vector<std::string> JavaScriptObject::getPropertyNames() {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  jsi::Array properties = jsObject->getPropertyNames(rawRuntime);
  auto size = properties.size(rawRuntime);

  std::vector<std::string> names(size);
  for (size_t i = 0; i < size; i++) {
    auto propertyName = properties
      .getValueAtIndex(rawRuntime, i)
      .asString(rawRuntime)
      .utf8(rawRuntime);
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

jni::local_ref<jni::HybridClass<JavaScriptWeakObject, Destructible>::javaobject>
JavaScriptObject::createWeak() {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  return JavaScriptWeakObject::newInstance(
    expo::getJSIContext(rawRuntime),
    runtimeHolder,
    get()
  );
}

jni::local_ref<JavaScriptFunction::javaobject> JavaScriptObject::jniAsFunction() {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  auto jsFuncion = std::make_shared<jsi::Function>(jsObject->asFunction(rawRuntime));
  return JavaScriptFunction::newInstance(
    expo::getJSIContext(rawRuntime),
    runtimeHolder,
    jsFuncion
  );
}

void JavaScriptObject::setProperty(const std::string &name, jsi::Value value) {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  jsObject->setProperty(rawRuntime, name.c_str(), value);
}

void JavaScriptObject::unsetProperty(jni::alias_ref<jstring> name) {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  auto cName = name->toStdString();
  jsObject->setProperty(
    rawRuntime,
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
  JSIContext *jsiContext,
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::Object> jsObject
) {
  auto object = JavaScriptObject::newObjectCxxArgs(std::move(runtime), std::move(jsObject));
  jsiContext->jniDeallocator->addReference(object);
  return object;
}

void JavaScriptObject::defineNativeDeallocator(
  jni::alias_ref<JNIFunctionBody::javaobject> deallocator
) {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  jni::global_ref<JNIFunctionBody::javaobject> globalRef = jni::make_global(deallocator);

  common::setDeallocator(
    rawRuntime,
    jsObject,
    [globalRef = std::move(globalRef)]() mutable {
      auto args = jni::Environment::ensureCurrentThreadIsAttached()->NewObjectArray(
        0,
        JCacheHolder::get().jObject,
        nullptr
      );
      JNIFunctionBody::invoke(globalRef.get(), args);
      globalRef.reset();
    }
  );
}

void JavaScriptObject::setExternalMemoryPressure(int size) {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  jsObject->setExternalMemoryPressure(rawRuntime, size);
}

bool JavaScriptObject::isArray() {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  return jsObject->isArray(rawRuntime);
}

jni::local_ref<jni::JArrayClass<JavaScriptValue::javaobject>> JavaScriptObject::getArray() {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();
  auto jsiContext = expo::getJSIContext(rawRuntime);

  auto jsArray = jsObject->getArray(rawRuntime);
  size_t size = jsArray.size(rawRuntime);

  auto result = jni::JArrayClass<JavaScriptValue::javaobject>::newArray(size);
  for (size_t i = 0; i < size; i++) {
    auto element = JavaScriptValue::newInstance(
      jsiContext,
      runtimeHolder,
      std::make_shared<jsi::Value>(jsArray.getValueAtIndex(rawRuntime, i))
    );

    result->setElement(i, element.release());
  }
  return result;
}

bool JavaScriptObject::isArrayBuffer() {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  return jsObject->isArrayBuffer(rawRuntime);
}

jni::local_ref<JavaScriptArrayBuffer::javaobject> JavaScriptObject::getArrayBuffer() {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();
  auto jsiContext = expo::getJSIContext(rawRuntime);

  return JavaScriptArrayBuffer::newInstance(
    jsiContext,
    runtimeHolder,
    std::make_shared<jsi::ArrayBuffer>(jsObject->getArrayBuffer(rawRuntime))
  );
}

} // namespace expo
