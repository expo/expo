// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JNIToJSIConverter.h"
#include "../JavaReferencesCache.h"
#include "../ObjectDeallocator.h"

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
    std::shared_ptr<expo::ObjectDeallocator> deallocator = std::make_shared<ObjectDeallocator>(
      [globalRef = std::move(globalRef)]() mutable {
        globalRef.reset();
      });

    auto descriptor = JavaScriptObject::preparePropertyDescriptor(rt, 0);
    descriptor.setProperty(rt, "value", jsi::Object::createFromHostObject(rt, deallocator));
    JavaScriptObject::defineProperty(rt, jsiObject.get(), "__expo_object_deallocator__",
                                     std::move(descriptor));

    return jsi::Value(rt, *jsiObject);
  }

  return jsi::Value::undefined();
}
} // namespace expo
