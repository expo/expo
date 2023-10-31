// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JNIToJSIConverter.h"
#include "../JavaReferencesCache.h"
#include "ObjectDeallocator.h"

#include <react/jni/ReadableNativeMap.h>
#include <react/jni/ReadableNativeArray.h>
#include <react/jni/WritableNativeArray.h>
#include <react/jni/WritableNativeMap.h>

namespace react = facebook::react;

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
    return jsi::String::createFromUtf8(
      rt,
      jni::static_ref_cast<jni::JString>(value)->toStdString()
    );
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
    return jsi::valueFromDynamic(rt, dynamic);
  }
  if (env->IsInstanceOf(
    unpackedValue,
    cache->getJClass("com/facebook/react/bridge/WritableNativeMap").clazz
  )) {
    auto dynamic = jni::static_ref_cast<react::WritableNativeMap::javaobject>(value)
      ->cthis()
      ->consume();
    return jsi::valueFromDynamic(rt, dynamic);
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
} // namespace expo
