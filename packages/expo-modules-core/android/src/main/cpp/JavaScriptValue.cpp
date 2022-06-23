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
                   makeNativeMethod("isArray", JavaScriptValue::isArray),
                   makeNativeMethod("isObject", JavaScriptValue::isObject),
                   makeNativeMethod("getBool", JavaScriptValue::getBool),
                   makeNativeMethod("getDouble", JavaScriptValue::getDouble),
                   makeNativeMethod("getString", JavaScriptValue::jniGetString),
                   makeNativeMethod("getObject", JavaScriptValue::getObject),
                   makeNativeMethod("getArray", JavaScriptValue::getArray),
                 });
}

JavaScriptValue::JavaScriptValue(
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::Value> jsValue
) : runtimeHolder(std::move(runtime)), jsValue(std::move(jsValue)) {
  assert(runtimeHolder.lock() != nullptr);
}

std::shared_ptr<jsi::Value> JavaScriptValue::get() {
  return jsValue;
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
  if (isArray()) {
    return "array";
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

bool JavaScriptValue::isArray() {
  if (jsValue->isObject()) {
    auto runtime = runtimeHolder.lock();
    assert(runtime != nullptr);
    return jsValue->asObject(*runtime->get()).isArray(*runtime->get());
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

jni::local_ref<jni::JArrayClass<JavaScriptValue::javaobject>> JavaScriptValue::getArray() {
  auto runtime = runtimeHolder.lock();
  assert(runtime != nullptr);

  auto jsArray = jsValue
    ->getObject(*runtime->get())
    .asArray(*runtime->get());
  size_t size = jsArray.size(*runtime->get());

  auto result = jni::JArrayClass<JavaScriptValue::javaobject>::newArray(size);
  for (size_t i = 0; i < size; i++) {
    auto element = JavaScriptValue::newObjectCxxArgs(
      runtimeHolder,
      std::make_shared<jsi::Value>(jsArray.getValueAtIndex(*runtime->get(), i))
    );

    result->setElement(i, element.release());
  }
  return result;
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
