// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "FrontendConverter.h"
#include "../JavaReferencesCache.h"
#include "../Exceptions.h"
#include "../JavaScriptTypedArray.h"
#include "../JSIInteropModuleRegistry.h"
#include "../JavaScriptObject.h"
#include "../JavaScriptValue.h"

#include "react/jni/ReadableNativeMap.h"
#include "react/jni/ReadableNativeArray.h"
#include <jsi/JSIDynamic.h>

#include <utility>
#include <algorithm>

namespace jni = facebook::jni;
namespace jsi = facebook::jsi;
namespace react = facebook::react;

namespace expo {
jobject IntegerFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  JSIInteropModuleRegistry *moduleRegistry,
  const jsi::Value &value
) const {
  auto &integerClass = JavaReferencesCache::instance()
    ->getJClass("java/lang/Integer");
  jmethodID integerConstructor = integerClass.getMethod("<init>", "(I)V");
  return env->NewObject(integerClass.clazz, integerConstructor,
                        static_cast<int>(value.getNumber()));
}

bool IntegerFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return value.isNumber();
}

jobject FloatFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  JSIInteropModuleRegistry *moduleRegistry,
  const jsi::Value &value
) const {
  auto &floatClass = JavaReferencesCache::instance()
    ->getJClass("java/lang/Float");
  jmethodID floatConstructor = floatClass.getMethod("<init>", "(F)V");
  return env->NewObject(floatClass.clazz, floatConstructor,
                        static_cast<float>(value.getNumber()));
}

bool FloatFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return value.isNumber();
}

jobject BooleanFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  JSIInteropModuleRegistry *moduleRegistry,
  const jsi::Value &value
) const {
  auto &booleanClass = JavaReferencesCache::instance()
    ->getJClass("java/lang/Boolean");
  jmethodID booleanConstructor = booleanClass.getMethod("<init>", "(Z)V");
  return env->NewObject(booleanClass.clazz, booleanConstructor, value.getBool());
}

bool BooleanFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return value.isBool();
}

jobject DoubleFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  JSIInteropModuleRegistry *moduleRegistry,
  const jsi::Value &value
) const {
  auto &doubleClass = JavaReferencesCache::instance()
    ->getJClass("java/lang/Double");
  jmethodID doubleConstructor = doubleClass.getMethod("<init>", "(D)V");
  return env->NewObject(doubleClass.clazz, doubleConstructor, value.getNumber());
}

bool DoubleFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return value.isNumber();
}

jobject StringFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  JSIInteropModuleRegistry *moduleRegistry,
  const jsi::Value &value
) const {
  return env->NewStringUTF(value.getString(rt).utf8(rt).c_str());
}

bool StringFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return value.isString();
}

jobject ReadableNativeArrayFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  JSIInteropModuleRegistry *moduleRegistry,
  const jsi::Value &value
) const {
  auto dynamic = jsi::dynamicFromValue(rt, value);
  return react::ReadableNativeArray::newObjectCxxArgs(std::move(dynamic)).release();
}

bool ReadableNativeArrayFrontendConverter::canConvert(
  jsi::Runtime &rt,
  const jsi::Value &value
) const {
  return value.isObject() && value.getObject(rt).isArray(rt);
}

jobject ReadableNativeMapArrayFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  JSIInteropModuleRegistry *moduleRegistry,
  const jsi::Value &value
) const {
  auto dynamic = jsi::dynamicFromValue(rt, value);
  return react::ReadableNativeMap::createWithContents(std::move(dynamic)).release();
}

bool ReadableNativeMapArrayFrontendConverter::canConvert(
  jsi::Runtime &rt,
  const jsi::Value &value) const {
  return value.isObject();
}

jobject TypedArrayFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  JSIInteropModuleRegistry *moduleRegistry,
  const jsi::Value &value
) const {
  return JavaScriptTypedArray::newObjectCxxArgs(
    moduleRegistry->runtimeHolder->weak_from_this(),
    std::make_shared<jsi::Object>(value.getObject(rt))
  ).release();
}

bool TypedArrayFrontendConverter::canConvert(
  jsi::Runtime &rt,
  const jsi::Value &value
) const {
  return value.isObject();
}

jobject JavaScriptValueFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  JSIInteropModuleRegistry *moduleRegistry,
  const jsi::Value &value
) const {
  return JavaScriptValue::newObjectCxxArgs(
    moduleRegistry->runtimeHolder->weak_from_this(),
    // TODO(@lukmccall): make sure that copy here is necessary
    std::make_shared<jsi::Value>(jsi::Value(rt, value))
  ).release();
}

bool JavaScriptValueFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return true;
}

jobject JavaScriptObjectFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  JSIInteropModuleRegistry *moduleRegistry,
  const jsi::Value &value
) const {
  return JavaScriptObject::newObjectCxxArgs(
    moduleRegistry->runtimeHolder->weak_from_this(),
    std::make_shared<jsi::Object>(value.getObject(rt))
  ).release();
}

bool JavaScriptObjectFrontendConverter::canConvert(
  jsi::Runtime &rt,
  const jsi::Value &value
) const {
  return value.isObject();
}

jobject UnknownFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  JSIInteropModuleRegistry *moduleRegistry,
  const jsi::Value &value
) const {
  auto stringRepresentation = value.toString(rt).utf8(rt);
  jni::throwNewJavaException(
    UnexpectedException::create(
      "Cannot convert '" + stringRepresentation + "' to a Kotlin type.").get()
  );
}

bool UnknownFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return true;
}

PolyFrontendConverter::PolyFrontendConverter(
  std::vector<std::shared_ptr<FrontendConverter>> converters
) : converters(std::move(converters)) {
}

bool PolyFrontendConverter::canConvert(
  jsi::Runtime &rt,
  const jsi::Value &value
) const {
  // Checks whether any of inner converters can handle the conversion.
  return std::any_of(
    converters.begin(),
    converters.end(),
    [&rt = rt, &value = value](const std::shared_ptr<FrontendConverter> &converter) {
      return converter->canConvert(rt, value);
    }
  );
}

jobject PolyFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  JSIInteropModuleRegistry *moduleRegistry,
  const jsi::Value &value
) const {
  for (auto &converter: converters) {
    if (converter->canConvert(rt, value)) {
      return converter->convert(rt, env, moduleRegistry, value);
    }
  }
  // That shouldn't happen.
  auto stringRepresentation = value.toString(rt).utf8(rt);
  jni::throwNewJavaException(
    UnexpectedException::create(
      "Cannot convert '" + stringRepresentation + "' to a Kotlin type.").get()
  );
}
} // namespace expo
