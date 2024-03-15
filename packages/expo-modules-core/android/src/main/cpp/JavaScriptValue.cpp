// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JavaScriptValue.h"

#include "JavaScriptRuntime.h"
#include "JavaScriptObject.h"
#include "JavaScriptTypedArray.h"
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
  runtimeHolder.ensureRuntimeIsValid();
}

JavaScriptValue::JavaScriptValue(
  WeakRuntimeHolder runtime,
  std::shared_ptr<jsi::Value> jsValue
) : runtimeHolder(std::move(runtime)), jsValue(std::move(jsValue)) {
  runtimeHolder.ensureRuntimeIsValid();
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
    auto &jsRuntime = runtimeHolder.getJSRuntime();
    return jsValue->asObject(jsRuntime).isFunction(jsRuntime);
  }

  return false;
}

bool JavaScriptValue::isArray() {
  if (jsValue->isObject()) {
    auto &jsRuntime = runtimeHolder.getJSRuntime();
    return jsValue->asObject(jsRuntime).isArray(jsRuntime);
  }

  return false;
}

bool JavaScriptValue::isObject() {
  return jsValue->isObject();
}

bool JavaScriptValue::isTypedArray() {
  if (jsValue->isObject()) {
    jsi::Runtime &jsRuntime = runtimeHolder.getJSRuntime();
    return expo::isTypedArray(jsRuntime, jsValue->getObject(jsRuntime));
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
  auto &jsRuntime = runtimeHolder.getJSRuntime();
  return jsValue->getString(jsRuntime).utf8(jsRuntime);
}

jni::local_ref<JavaScriptObject::javaobject> JavaScriptValue::getObject() {
  auto &jsRuntime = runtimeHolder.getJSRuntime();
  auto jsObject = std::make_shared<jsi::Object>(jsValue->getObject(jsRuntime));
  return JavaScriptObject::newInstance(
    runtimeHolder.getJSIContext(),
    runtimeHolder,
    jsObject
  );
}

jni::local_ref<JavaScriptFunction::javaobject> JavaScriptValue::jniGetFunction() {
  auto &jsRuntime = runtimeHolder.getJSRuntime();
  auto jsFunction = std::make_shared<jsi::Function>(
    jsValue->getObject(jsRuntime).asFunction(jsRuntime));
  return JavaScriptFunction::newInstance(
    runtimeHolder.getJSIContext(),
    runtimeHolder,
    jsFunction
  );
}

jni::local_ref<jni::JArrayClass<JavaScriptValue::javaobject>> JavaScriptValue::getArray() {
  auto &jsRuntime = runtimeHolder.getJSRuntime();
  auto moduleRegistry = runtimeHolder.getJSIContext();

  auto jsArray = jsValue
    ->getObject(jsRuntime)
    .asArray(jsRuntime);
  size_t size = jsArray.size(jsRuntime);

  auto result = jni::JArrayClass<JavaScriptValue::javaobject>::newArray(size);
  for (size_t i = 0; i < size; i++) {
    auto element = JavaScriptValue::newInstance(
      moduleRegistry,
      runtimeHolder,
      std::make_shared<jsi::Value>(jsArray.getValueAtIndex(jsRuntime, i))
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
  auto &jsRuntime = runtimeHolder.getJSRuntime();
  auto jsObject = std::make_shared<jsi::Object>(jsValue->getObject(jsRuntime));
  return JavaScriptTypedArray::newInstance(
    runtimeHolder.getJSIContext(),
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
