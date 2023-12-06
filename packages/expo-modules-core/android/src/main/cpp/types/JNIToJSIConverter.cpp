// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JNIToJSIConverter.h"
#include "../JavaReferencesCache.h"
#include "ObjectDeallocator.h"

#include <react/jni/ReadableNativeMap.h>
#include <react/jni/ReadableNativeArray.h>
#include <react/jni/WritableNativeArray.h>
#include <react/jni/WritableNativeMap.h>

namespace react = facebook::react;

namespace {

// This value should be synced with the value in **FollyDynamicExtensionConverter.kt**
constexpr char DYNAMIC_EXTENSION_PREFIX[] = "__expo_dynamic_extension__#";

/**
 * Create an JavaScript Uint8Array instance from Java ByteArray.
 */
jsi::Value createUint8Array(jsi::Runtime &rt, jni::alias_ref<jni::JArrayByte> byteArray) {
  auto arrayBufferCtor = rt.global().getPropertyAsFunction(rt, "ArrayBuffer");
  auto arrayBufferObject = arrayBufferCtor.callAsConstructor(rt, static_cast<int>(byteArray->size())).getObject(rt);
  auto arrayBuffer = arrayBufferObject.getArrayBuffer(rt);
  byteArray->getRegion(0, byteArray->size(), reinterpret_cast<signed char *>(arrayBuffer.data(rt)));

  auto uint8ArrayCtor = rt.global().getPropertyAsFunction(rt, "Uint8Array");
  auto uint8Array = uint8ArrayCtor.callAsConstructor(rt, arrayBufferObject).getObject(rt);
  return uint8Array;
}

/**
 * Convert a string with FollyDynamicExtensionConverter support.
 */
std::optional<jsi::Value> convertStringToFollyDynamicIfNeeded(jsi::Runtime &rt, const std::string& string) {
  if (!string.starts_with(DYNAMIC_EXTENSION_PREFIX)) {
    return std::nullopt;
  }
  auto converterClass = jni::findClassLocal("expo/modules/kotlin/types/folly/FollyDynamicExtensionConverter");
  const auto getInstanceMethod = converterClass->getStaticMethod<jni::JObject(std::string)>("get");
  jni::local_ref<jni::JObject> instance = getInstanceMethod(converterClass, string);

  if (instance->isInstanceOf(jni::JArrayByte::javaClassStatic())) {
    return createUint8Array(rt, jni::static_ref_cast<jni::JArrayByte>(instance));
  }
  return std::nullopt;
}

} // namespace

namespace expo {

jsi::Value convert(
  JSIInteropModuleRegistry *moduleRegistry,
  JNIEnv *env,
  jsi::Runtime &rt,
  jni::local_ref<jobject> value
) {
  if (value == nullptr) {
    return jsi::Value::undefined();
  }
  auto unpackedValue = value.get();
  auto cache = JavaReferencesCache::instance();
  if (env->IsInstanceOf(unpackedValue, cache->getJClass("java/lang/Double").clazz)) {
    return {jni::static_ref_cast<jni::JDouble>(value)->value()};
  }
  if (env->IsInstanceOf(unpackedValue, cache->getJClass("java/lang/Integer").clazz)) {
    return {jni::static_ref_cast<jni::JInteger>(value)->value()};
  }
  if (env->IsInstanceOf(unpackedValue, cache->getJClass("java/lang/Long").clazz)) {
    return {(double) jni::static_ref_cast<jni::JLong>(value)->value()};
  }
  if (env->IsInstanceOf(unpackedValue, cache->getJClass("java/lang/String").clazz)) {
    std::string string = jni::static_ref_cast<jni::JString>(value)->toStdString();
    auto enhancedValue = convertStringToFollyDynamicIfNeeded(rt, string);
    return enhancedValue ? std::move(*enhancedValue) : jsi::String::createFromUtf8(rt, string);
  }
  if (env->IsInstanceOf(unpackedValue, cache->getJClass("java/lang/Boolean").clazz)) {
    return {(bool) jni::static_ref_cast<jni::JBoolean>(value)->value()};
  }
  if (env->IsInstanceOf(unpackedValue, cache->getJClass("java/lang/Float").clazz)) {
    return {(double) jni::static_ref_cast<jni::JFloat>(value)->value()};
  }
  if (env->IsInstanceOf(
    unpackedValue,
    cache->getJClass("com/facebook/react/bridge/WritableNativeArray").clazz
  )) {
    auto dynamic = jni::static_ref_cast<react::WritableNativeArray::javaobject>(value)
      ->cthis()
      ->consume();
    auto arg = jsi::valueFromDynamic(rt, dynamic);
    auto enhancedArg = decorateValueForDynamicExtension(rt, arg);
    if (enhancedArg) {
      arg = std::move(*enhancedArg);
    }
    return arg;
  }
  if (env->IsInstanceOf(
    unpackedValue,
    cache->getJClass("com/facebook/react/bridge/WritableNativeMap").clazz
  )) {
    auto dynamic = jni::static_ref_cast<react::WritableNativeMap::javaobject>(value)
      ->cthis()
      ->consume();
    auto arg = jsi::valueFromDynamic(rt, dynamic);
    auto enhancedArg = decorateValueForDynamicExtension(rt, arg);
    if (enhancedArg) {
      arg = std::move(*enhancedArg);
    }
    return arg;
  }
  if (env->IsInstanceOf(unpackedValue, JavaScriptModuleObject::javaClassStatic().get())) {
    auto anonymousObject = jni::static_ref_cast<JavaScriptModuleObject::javaobject>(value)
      ->cthis();
    anonymousObject->jsiInteropModuleRegistry = moduleRegistry;
    auto jsiObject = anonymousObject->getJSIObject(rt);

    jni::global_ref<jobject> globalRef = jni::make_global(value);

    common::setDeallocator(
      rt,
      jsiObject,
      [globalRef = std::move(globalRef)]() mutable {
        globalRef.reset();
      }
    );

    return jsi::Value(rt, *jsiObject);
  }
  if (env->IsInstanceOf(
    unpackedValue,
    cache->getJClass(
      "expo/modules/kotlin/sharedobjects/SharedObject").clazz
  )) {
    auto jsObject = std::make_shared<jsi::Object>(jsi::Object(rt));
    auto jsObjectRef = JavaScriptObject::newInstance(
      moduleRegistry,
      moduleRegistry->runtimeHolder,
      jsObject
    );
    moduleRegistry->registerSharedObject(jni::make_local(unpackedValue), jsObjectRef);
    return jsi::Value(rt, *jsObject);
  }
  if (env->IsInstanceOf(
    unpackedValue,
    cache->getJClass("expo/modules/kotlin/jni/JavaScriptTypedArray").clazz
  )) {
    auto typedArray = jni::static_ref_cast<JavaScriptTypedArray::javaobject>(value);
    auto jsTypedArray = typedArray->cthis()->get();
    return jsi::Value(rt, *jsTypedArray);
  }

  return jsi::Value::undefined();
}

std::optional<jsi::Value> decorateValueForDynamicExtension(jsi::Runtime &rt, const jsi::Value &value) {
  if (value.isString()) {
    std::string string = value.getString(rt).utf8(rt);
    return convertStringToFollyDynamicIfNeeded(rt, string);
  }

  if (value.isObject()) {
    auto jsObject = value.getObject(rt);
    if (jsObject.isArray(rt)) {
      bool changed = false;
      auto jsArray = jsObject.getArray(rt);
      size_t length = jsArray.length(rt);
      for (size_t i = 0; i < length; ++i) {
        auto converted = decorateValueForDynamicExtension(rt, jsArray.getValueAtIndex(rt, i));
        if (converted) {
          jsArray.setValueAtIndex(rt, i, std::move(*converted));
          changed = true;
        }
      }
      return changed ? std::make_optional<jsi::Value>(std::move(jsArray)) : std::nullopt;
    } else {
      bool changed = false;
      auto propNames = jsObject.getPropertyNames(rt);
      size_t length = propNames.length(rt);
      for (size_t i = 0; i < length; ++i) {
        auto propName = propNames.getValueAtIndex(rt, i).getString(rt);
        auto converted = decorateValueForDynamicExtension(rt, jsObject.getProperty(rt, propName));
        if (converted) {
          jsObject.setProperty(rt, propName, std::move(*converted));
          changed = true;
        }
      }
      return changed ? std::make_optional<jsi::Value>(std::move(jsObject)) : std::nullopt;
    }
  }

  return std::nullopt;
}

} // namespace expo
