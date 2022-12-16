// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptObject.h"
#include "JavaScriptValue.h"
#include "JavaScriptRuntime.h"
#include "JSITypeConverter.h"

namespace expo {
void JavaScriptObject::registerNatives() {
  registerHybrid({
                   makeNativeMethod("hasProperty", JavaScriptObject::jniHasProperty),
                   makeNativeMethod("getProperty", JavaScriptObject::jniGetProperty),
                   makeNativeMethod("getPropertyNames", JavaScriptObject::jniGetPropertyNames),
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
  return JavaScriptValue::newObjectCxxArgs(runtimeHolder, result);
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
  descriptor.setProperty(jsRuntime, "writable", (bool) ((1 << 2) & options));
  return descriptor;
}
} // namespace expo
