// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptValue.h"

#include "JavaScriptRuntime.h"
#include "JavaScriptObject.h"
#include "JavaScriptTypedArray.h"
#include "JavaScriptArrayBuffer.h"
#include "JavaScriptFunction.h"
#include "TypedArray.h"
#include "Exceptions.h"
#include "JSIContext.h"

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
                   makeNativeMethod("isTypedArray", JavaScriptValue::isTypedArray),
                   makeNativeMethod("isObject", JavaScriptValue::isObject),
                   makeNativeMethod("getBool", JavaScriptValue::getBool),
                   makeNativeMethod("getDouble", JavaScriptValue::getDouble),
                   makeNativeMethod("getString", JavaScriptValue::jniGetString),
                   makeNativeMethod("getObject", JavaScriptValue::getObject),
                   makeNativeMethod("getArray", JavaScriptValue::getArray),
                   makeNativeMethod("getTypedArray", JavaScriptValue::getTypedArray),
                   makeNativeMethod("jniGetFunction", JavaScriptValue::jniGetFunction),
                 });
}

JavaScriptValue::JavaScriptValue(
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::Value> jsValue
) : runtimeHolder(std::move(runtime)), jsValue(std::move(jsValue)) {
  assert((!runtimeHolder.expired()) && "JS Runtime was used after deallocation");
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

  throwNewJavaException(
    UnexpectedException::create("Unknown type").get()
  );
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
    assert((runtime != nullptr) && "JS Runtime was used after deallocation");
    auto &rawRuntime = runtime->get();

    return jsValue->asObject(rawRuntime).isFunction(rawRuntime);
  }

  return false;
}

bool JavaScriptValue::isArray() {
  if (jsValue->isObject()) {
    auto runtime = runtimeHolder.lock();
    assert((runtime != nullptr) && "JS Runtime was used after deallocation");
    auto &rawRuntime = runtime->get();

    return jsValue->asObject(rawRuntime).isArray(rawRuntime);
  }

  return false;
}

bool JavaScriptValue::isObject() {
  return jsValue->isObject();
}

bool JavaScriptValue::isTypedArray() {
  if (jsValue->isObject()) {
    auto runtime = runtimeHolder.lock();
    assert((runtime != nullptr) && "JS Runtime was used after deallocation");
    auto &rawRuntime = runtime->get();

    return expo::isTypedArray(rawRuntime, jsValue->getObject(rawRuntime));
  }
  return false;
}

bool JavaScriptValue::getBool() {
  return jsValue->getBool();
}

double JavaScriptValue::getDouble() {
  return jsValue->getNumber();
}

std::string JavaScriptValue::getString() {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  return jsValue->getString(rawRuntime).utf8(rawRuntime);
}

jni::local_ref<JavaScriptObject::javaobject> JavaScriptValue::getObject() {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  auto jsObject = std::make_shared<jsi::Object>(jsValue->getObject(rawRuntime));
  return JavaScriptObject::newInstance(
    expo::getJSIContext(rawRuntime),
    runtimeHolder,
    jsObject
  );
}

jni::local_ref<JavaScriptFunction::javaobject> JavaScriptValue::jniGetFunction() {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  auto jsFunction = std::make_shared<jsi::Function>(
    jsValue->getObject(rawRuntime).asFunction(rawRuntime));
  return JavaScriptFunction::newInstance(
    expo::getJSIContext(rawRuntime),
    runtimeHolder,
    jsFunction
  );
}

jni::local_ref<jni::JArrayClass<JavaScriptValue::javaobject>> JavaScriptValue::getArray() {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();
  auto jsiContext = expo::getJSIContext(rawRuntime);

  auto jsArray = jsValue
    ->getObject(rawRuntime)
    .asArray(rawRuntime);
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

jni::local_ref<jstring> JavaScriptValue::jniKind() {
  auto result = kind();
  return jni::make_jstring(result);
}

jni::local_ref<jstring> JavaScriptValue::jniGetString() {
  auto result = getString();
  return jni::make_jstring(result);
}

jni::local_ref<JavaScriptTypedArray::javaobject> JavaScriptValue::getTypedArray() {
  auto runtime = runtimeHolder.lock();
  assert((runtime != nullptr) && "JS Runtime was used after deallocation");
  auto &rawRuntime = runtime->get();

  auto jsObject = std::make_shared<jsi::Object>(jsValue->getObject(rawRuntime));
  return JavaScriptTypedArray::newInstance(
    expo::getJSIContext(rawRuntime),
    runtimeHolder,
    jsObject
  );
}

jni::local_ref<JavaScriptValue::javaobject> JavaScriptValue::newInstance(
  JSIContext *jsiContext,
  std::weak_ptr<JavaScriptRuntime> runtime,
  std::shared_ptr<jsi::Value> jsValue
) {
  auto value = JavaScriptValue::newObjectCxxArgs(
    std::move(runtime),
    std::move(jsValue)
  );
  jsiContext->jniDeallocator->addReference(value);
  return value;
}
} // namespace expo
