// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptValue.h"

#include "JavaScriptRuntime.h"
#include "JavaScriptObject.h"

namespace expo {
void JavaScriptValue::registerNatives() {
  registerHybrid({
                   makeNativeMethod("kind", JavaScriptValue::jniKind),
                   makeNativeMethod("isNull", JavaScriptValue::isNull),
                   makeNativeMethod("isUndefined", JavaScriptValue::isUndefined),
                   makeNativeMethod("isBool", JavaScriptValue::isBool),
                   makeNativeMethod("isNumber", JavaScriptValue::isNumber),
                   makeNativeMethod("isString", JavaScriptValue::isString),
                   makeNativeMethod("isSymbol", JavaScriptValue::isSymbol),
                   makeNativeMethod("isFunction", JavaScriptValue::isFunction),
                   makeNativeMethod("isObject", JavaScriptValue::isObject),
                   makeNativeMethod("getBool", JavaScriptValue::getBool),
                   makeNativeMethod("getDouble", JavaScriptValue::getDouble),
                   makeNativeMethod("getString", JavaScriptValue::jniGetString),
                   makeNativeMethod("getObject", JavaScriptValue::getObject),
                 });
}

JavaScriptValue::JavaScriptValue(
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::Value> jsValue
) : runtimeHolder(std::move(runtime)), jsValue(std::move(jsValue)) {
  assert(runtimeHolder.lock() != nullptr);
}

std::string JavaScriptValue::kind() {
  if (isNull()) {
    return "null";
  }
  if (isUndefined()) {
    return "undefined";
  }
  if (isBool()) {
    return "boolean";
  }
  if (isNumber()) {
    return "number";
  }
  if (isString()) {
    return "string";
  }
  if (isSymbol()) {
    return "symbol";
  }
  if (isFunction()) {
    return "function";
  }
  if (isObject()) {
    return "object";
  }

  // TODO(@lukmccall): maybe throw exception?
  return "unknown";
}

bool JavaScriptValue::isNull() {
  return jsValue->isNull();
}

bool JavaScriptValue::isUndefined() {
  return jsValue->isUndefined();
}

bool JavaScriptValue::isBool() {
  return jsValue->isBool();
}

bool JavaScriptValue::isNumber() {
  return jsValue->isNumber();
}

bool JavaScriptValue::isString() {
  return jsValue->isString();
}

bool JavaScriptValue::isSymbol() {
  return jsValue->isSymbol();
}

bool JavaScriptValue::isFunction() {
  if (jsValue->isObject()) {
    auto runtime = runtimeHolder.lock();
    assert(runtime != nullptr);
    return jsValue->asObject(*runtime->get()).isFunction(*runtime->get());
  }

  return false;
}

bool JavaScriptValue::isObject() {
  return jsValue->isObject();
}

bool JavaScriptValue::getBool() {
  return jsValue->getBool();
}

double JavaScriptValue::getDouble() {
  return jsValue->getNumber();
}

std::string JavaScriptValue::getString() {
  auto runtime = runtimeHolder.lock();
  assert(runtime != nullptr);
  return jsValue->getString(*runtime->get()).utf8(*runtime->get());
}

jni::local_ref<JavaScriptObject::javaobject> JavaScriptValue::getObject() {
  auto runtime = runtimeHolder.lock();
  assert(runtime != nullptr);
  auto jsObject = std::make_shared<jsi::Object>(jsValue->getObject(*runtime->get()));
  return JavaScriptObject::newObjectCxxArgs(runtimeHolder, jsObject);
}

jni::local_ref<jstring> JavaScriptValue::jniKind() {
  auto result = kind();
  return jni::make_jstring(result);
}

jni::local_ref<jstring> JavaScriptValue::jniGetString() {
  auto result = getString();
  return jni::make_jstring(result);
}
} // namespace expo
