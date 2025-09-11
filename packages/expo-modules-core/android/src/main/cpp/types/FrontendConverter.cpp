// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "FrontendConverter.h"
#include "ExpectedType.h"
#include "FrontendConverterProvider.h"
#include "../JavaReferencesCache.h"
#include "../Exceptions.h"
#include "../JavaScriptTypedArray.h"
#include "../JSIContext.h"
#include "../JavaScriptObject.h"
#include "../JavaScriptValue.h"
#include "../JavaScriptFunction.h"
#include "../javaclasses/Collections.h"

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
  const jsi::Value &value
) const {
  auto &integerClass = JCacheHolder::get().jInteger;
  return env->NewObject(integerClass.clazz, integerClass.constructor,
                        static_cast<int>(value.asNumber()));
}

bool IntegerFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return value.isNumber();
}

jobject LongFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  auto &longClass = JCacheHolder::get().jLong;
  return env->NewObject(longClass.clazz, longClass.constructor,
                        static_cast<jlong>(value.asNumber()));
}

bool LongFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return value.isNumber();
}

jobject FloatFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  auto &floatClass = JCacheHolder::get().jFloat;
  return env->NewObject(floatClass.clazz, floatClass.constructor,
                        static_cast<float>(value.asNumber()));
}

bool FloatFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return value.isNumber();
}

jobject BooleanFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  auto &booleanClass = JCacheHolder::get().jBoolean;
  return env->NewObject(booleanClass.clazz, booleanClass.constructor, value.asBool());
}

bool BooleanFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return value.isBool();
}

jobject DoubleFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  auto &doubleClass = JCacheHolder::get().jDouble;
  return env->NewObject(doubleClass.clazz, doubleClass.constructor, value.asNumber());
}

bool DoubleFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return value.isNumber();
}

jobject StringFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  return env->NewStringUTF(value.asString(rt).utf8(rt).c_str());
}

bool StringFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return value.isString();
}

jobject ReadableNativeArrayFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
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

jobject ByteArrayFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  auto typedArray = TypedArray(rt, value.asObject(rt));
  size_t length = typedArray.byteLength(rt);
  auto byteArray = jni::JArrayByte::newArray(length);
  byteArray->setRegion(0, length, static_cast<const signed char *>(typedArray.getRawPointer(rt)));
  return byteArray.release();
}

bool ByteArrayFrontendConverter::canConvert(
  jsi::Runtime &rt,
  const jsi::Value &value
) const {
  if (value.isObject()) {
    auto object = value.getObject(rt);
    if (isTypedArray(rt, object)) {
      auto typedArray = TypedArray(rt, object);
      return typedArray.getKind(rt) == TypedArrayKind::Uint8Array;
    }
  }
  return false;
}

jobject TypedArrayFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  JSIContext *jsiContext = getJSIContext(rt);
  return JavaScriptTypedArray::newInstance(
    jsiContext,
    jsiContext->runtimeHolder->weak_from_this(),
    std::make_shared<jsi::Object>(value.asObject(rt))
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
  const jsi::Value &value
) const {
  JSIContext *jsiContext = getJSIContext(rt);
  return JavaScriptValue::newInstance(
    jsiContext,
    jsiContext->runtimeHolder->weak_from_this(),
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
  const jsi::Value &value
) const {
  JSIContext *jsiContext = getJSIContext(rt);
  return JavaScriptObject::newInstance(
    jsiContext,
    jsiContext->runtimeHolder->weak_from_this(),
    std::make_shared<jsi::Object>(value.asObject(rt))
  ).release();
}

bool JavaScriptObjectFrontendConverter::canConvert(
  jsi::Runtime &rt,
  const jsi::Value &value
) const {
  return value.isObject();
}

jobject JavaScriptFunctionFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  JSIContext *jsiContext = getJSIContext(rt);
  return JavaScriptFunction::newInstance(
    jsiContext,
    jsiContext->runtimeHolder->weak_from_this(),
    std::make_shared<jsi::Function>(value.asObject(rt).asFunction(rt))
  ).release();
}

bool JavaScriptFunctionFrontendConverter::canConvert(
  jsi::Runtime &rt,
  const jsi::Value &value
) const {
  return value.isObject() && value.getObject(rt).isFunction(rt);
}

jobject UnknownFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  auto stringRepresentation = value.toString(rt).utf8(rt);
  throwNewJavaException(
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
  const jsi::Value &value
) const {
  for (auto &converter: converters) {
    if (converter->canConvert(rt, value)) {
      return converter->convert(rt, env, value);
    }
  }
  // That shouldn't happen.
  auto stringRepresentation = value.toString(rt).utf8(rt);
  throwNewJavaException(
    UnexpectedException::create(
      "Cannot convert '" + stringRepresentation + "' to a Kotlin type.").get()
  );
}

PrimitiveArrayFrontendConverter::PrimitiveArrayFrontendConverter(
  jni::local_ref<SingleType::javaobject> expectedType
) {
  auto parameterExpectedType = expectedType->getFirstParameterType();
  parameterType = parameterExpectedType->getCombinedTypes();
  parameterConverter = FrontendConverterProvider::instance()->obtainConverter(
    parameterExpectedType
  );
  javaType = parameterExpectedType->getJClassString();
}

template<typename T, typename A>
jobject createPrimitiveArray(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Array &jsArray,
  A (JNIEnv::*arrayConstructor)(jsize),
  void (JNIEnv::*setRegion)(A, jsize, jsize, const T *)
) {
  size_t size = jsArray.size(rt);
  std::vector<T> tmpVector(size);
  for (size_t i = 0; i < size; i++) {
    tmpVector[i] = (T) jsArray.getValueAtIndex(rt, i).asNumber();
  }
  auto result = std::invoke(arrayConstructor, env, size);
  std::invoke(setRegion, env, result, 0, size, tmpVector.data());
  return result;
}

jobject PrimitiveArrayFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  auto jsArray = value.asObject(rt).asArray(rt);
  auto _createPrimitiveArray = [&rt, env, &jsArray](
    auto arrayConstructor, auto setRegion
  ) -> jobject {
    return createPrimitiveArray(rt, env, jsArray, arrayConstructor, setRegion);
  };

  if (parameterType == CppType::INT) {
    return _createPrimitiveArray(
      &JNIEnv::NewIntArray,
      &JNIEnv::SetIntArrayRegion
    );
  }
  if (parameterType == CppType::LONG) {
    return _createPrimitiveArray(
      &JNIEnv::NewLongArray,
      &JNIEnv::SetLongArrayRegion
    );
  }
  if (parameterType == CppType::DOUBLE) {
    return _createPrimitiveArray(
      &JNIEnv::NewDoubleArray,
      &JNIEnv::SetDoubleArrayRegion
    );
  }
  if (parameterType == CppType::FLOAT) {
    return _createPrimitiveArray(
      &JNIEnv::NewFloatArray,
      &JNIEnv::SetFloatArrayRegion
    );
  }
  if (parameterType == CppType::BOOLEAN) {
    return _createPrimitiveArray(
      &JNIEnv::NewBooleanArray,
      &JNIEnv::SetBooleanArrayRegion
    );
  }

  size_t size = jsArray.size(rt);
  auto result = env->NewObjectArray(
    size,
    JCacheHolder::get().getOrLoadJClass(env, javaType),
    nullptr
  );
  for (size_t i = 0; i < size; i++) {
    auto convertedElement = parameterConverter->convert(
      rt, env, jsArray.getValueAtIndex(rt, i)
    );
    env->SetObjectArrayElement(result, i, convertedElement);
    env->DeleteLocalRef(convertedElement);
  }
  return result;
}

bool PrimitiveArrayFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return value.isObject() && value.getObject(rt).isArray(rt);
}

ArrayFrontendConverter::ArrayFrontendConverter(
  jni::local_ref<SingleType::javaobject> expectedType
) {
  auto parameterExpectedType = expectedType->getFirstParameterType();
  parameterType = parameterExpectedType->getCombinedTypes();
  parameterConverter = FrontendConverterProvider::instance()->obtainConverter(
    parameterExpectedType
  );
  javaType = parameterExpectedType->getJClassString();
}

jobject ArrayFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  auto jsArray = value.asObject(rt).asArray(rt);
  size_t size = jsArray.size(rt);
  auto result = env->NewObjectArray(
    size,
    JCacheHolder::get().getOrLoadJClass(env, javaType),
    nullptr
  );
  for (size_t i = 0; i < size; i++) {
    auto convertedElement = parameterConverter->convert(
      rt, env, jsArray.getValueAtIndex(rt, i)
    );
    env->SetObjectArrayElement(result, i, convertedElement);
    env->DeleteLocalRef(convertedElement);
  }
  return result;
}

bool ArrayFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return value.isObject() && value.getObject(rt).isArray(rt);
}

ListFrontendConverter::ListFrontendConverter(
  jni::local_ref<SingleType::javaobject> expectedType
) : parameterConverter(
  FrontendConverterProvider::instance()->obtainConverter(
    expectedType->getFirstParameterType()
  )
) {}

jobject ListFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  if (!value.isObject()) {
    return convertSingleValue(rt, env, value);
  }

  auto valueObject = value.asObject(rt);
  if (!valueObject.isArray(rt)) {
    return convertSingleValue(rt, env, value);
  }

  auto jsArray = valueObject.asArray(rt);
  size_t size = jsArray.size(rt);

  auto arrayList = java::ArrayList<jobject>::create(size);
  for (size_t i = 0; i < size; i++) {
    auto jsValue = jsArray.getValueAtIndex(rt, i);
    auto convertedElement = parameterConverter->convert(
      rt, env, jsValue
    );
    arrayList->add(convertedElement);
    env->DeleteLocalRef(convertedElement);
  }

  return arrayList.release();
}

jobject ListFrontendConverter::convertSingleValue(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  auto result = java::ArrayList<jobject>::create(1);
  result->add(parameterConverter->convert(rt, env, value));
  return result.release();
}

bool ListFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return (value.isObject() && value.getObject(rt).isArray(rt)) ||
         parameterConverter->canConvert(rt, value);
}

MapFrontendConverter::MapFrontendConverter(
  jni::local_ref<SingleType::javaobject> expectedType
) : valueConverter(
  FrontendConverterProvider::instance()->obtainConverter(
    expectedType->getFirstParameterType()
  )
) {}

jobject MapFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  auto jsObject = value.asObject(rt);
  auto propertyNames = jsObject.getPropertyNames(rt);
  size_t size = propertyNames.size(rt);
  auto map = java::LinkedHashMap<jobject, jobject>::create(size);

  for (size_t i = 0; i < size; i++) {
    auto key = propertyNames.getValueAtIndex(rt, i).getString(rt);
    auto jsValue = jsObject.getProperty(rt, key);

    auto convertedKey = env->NewStringUTF(key.utf8(rt).c_str());

    auto convertedValue = valueConverter->convert(
      rt, env, jsValue
    );

    map->put(convertedKey, convertedValue);

    env->DeleteLocalRef(convertedKey);
    env->DeleteLocalRef(convertedValue);
  }

  return map.release();
}

bool MapFrontendConverter::canConvert(
  jsi::Runtime &rt,
  const jsi::Value &value
) const {
  return value.isObject();
}

jobject ViewTagFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  auto nativeTag = value.asObject(rt).getProperty(rt, "nativeTag");
  if (nativeTag.isNull()) {
    return nullptr;
  }

  auto viewTag = (int) nativeTag.getNumber();
  auto &integerClass = JCacheHolder::get().jInteger;
  return env->NewObject(integerClass.clazz, integerClass.constructor, viewTag);
}

bool ViewTagFrontendConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return value.isObject() && value.getObject(rt).hasProperty(rt, "nativeTag");
}

jobject SharedObjectIdConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  auto objectId = value.asObject(rt).getProperty(rt, "__expo_shared_object_id__");
  if (objectId.isNull()) {
    return nullptr;
  }

  int id = (int) objectId.asNumber();
  auto &integerClass = JCacheHolder::get().jInteger;
  return env->NewObject(integerClass.clazz, integerClass.constructor, id);
}

bool SharedObjectIdConverter::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return value.isObject() && value.getObject(rt).hasProperty(rt, "__expo_shared_object_id__");
}

jobject AnyFrontendConvert::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  if (booleanConverter.canConvert(rt, value)) {
    return booleanConverter.convert(rt, env, value);
  }

  if (doubleConverter.canConvert(rt, value)) {
    return doubleConverter.convert(rt, env, value);
  }

  if (stringConverter.canConvert(rt, value)) {
    return stringConverter.convert(rt, env, value);
  }

  const jsi::Object &obj = value.asObject(rt);

  if (obj.isArray(rt)) {
    const jsi::Array &jsArray = obj.asArray(rt);
    size_t size = jsArray.size(rt);

    auto arrayList = java::ArrayList<jobject>::create(size);
    for (size_t i = 0; i < size; i++) {
      auto jsValue = jsArray.getValueAtIndex(rt, i);

      auto convertedElement = this->convert(
        rt, env, jsValue
      );
      arrayList->add(convertedElement);
      env->DeleteLocalRef(convertedElement);
    }

    return arrayList.release();
  }

  // it's object, so we're going to convert it to LinkedHashMap
  auto propertyNames = obj.getPropertyNames(rt);
  size_t size = propertyNames.size(rt);
  auto map = java::LinkedHashMap<jobject, jobject>::create(size);

  for (size_t i = 0; i < size; i++) {
    auto key = propertyNames.getValueAtIndex(rt, i).getString(rt);
    auto jsValue = obj.getProperty(rt, key);

    auto convertedKey = env->NewStringUTF(key.utf8(rt).c_str());
    auto convertedValue = this->convert(
      rt, env, jsValue
    );

    map->put(convertedKey, convertedValue);

    env->DeleteLocalRef(convertedKey);
    env->DeleteLocalRef(convertedValue);
  }

  return map.release();
}

bool AnyFrontendConvert::canConvert(jsi::Runtime &rt, const jsi::Value &value) const {
  return true;
}

NullableFrontendConverter::NullableFrontendConverter(
  jni::local_ref<SingleType::javaobject> expectedType
) : parameterConverter(
  FrontendConverterProvider::instance()->obtainConverter(
    expectedType->getFirstParameterType()
  )
) {}

bool NullableFrontendConverter::canConvert(
  jsi::Runtime &rt,
  const jsi::Value &value
) const {
  return value.isNull() || value.isUndefined() ||
         parameterConverter->canConvert(rt, value);
}

jobject NullableFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  if (value.isNull() || value.isUndefined()) {
    return nullptr;
  }

  return parameterConverter->convert(rt, env, value);
}

ValueOrUndefinedFrontendConverter::ValueOrUndefinedFrontendConverter(
  jni::local_ref<SingleType::javaobject> expectedType
) : parameterConverter(
  FrontendConverterProvider::instance()->obtainConverter(
    expectedType->getFirstParameterType()
  )
) {}

bool ValueOrUndefinedFrontendConverter::canConvert(
  jsi::Runtime &rt,
  const jsi::Value &value
) const {
  return value.isUndefined() ||
         parameterConverter->canConvert(rt, value);
}

jobject ValueOrUndefinedFrontendConverter::convert(
  jsi::Runtime &rt,
  JNIEnv *env,
  const jsi::Value &value
) const {
  if (value.isUndefined()) {
    return env->NewLocalRef(JCacheHolder::get().jUndefined);
  }

  return parameterConverter->convert(rt, env, value);
}

} // namespace expo
