// Copyright © 2021-present 650 Industries, Inc. (aka Expo)

#include "JNIToJSIConverter.h"
#include "../JavaReferencesCache.h"

namespace react = facebook::react;

namespace expo {

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

jsi::Value convert(
  JNIEnv *env,
  jsi::Runtime &rt,
  const jni::local_ref<jobject> &value
) {
  if (value == nullptr) {
    return jsi::Value::null();
  }
  auto unpackedValue = value.get();
  auto &cache = JCacheHolder::get();

  // We could use jni::static_ref_cast here. It will lead to the creation of a new local reference.
  // Which is actually slow. We can use some pointer magic to avoid it.
#define CAST_AND_RETURN(type, clazz) \
  if (env->IsInstanceOf(unpackedValue, clazz)) { \
    return convertToJS(env, rt, *((jni::local_ref<type>*)((void*)&value))); \
  }
#define COMMA ,

  CAST_AND_RETURN(jni::JDouble, cache.jDouble.clazz)
  CAST_AND_RETURN(jni::JInteger, cache.jInteger.clazz)
  CAST_AND_RETURN(jni::JLong, cache.jLong.clazz)
  CAST_AND_RETURN(jni::JString, cache.jString)
  CAST_AND_RETURN(jni::JBoolean, cache.jBoolean.clazz)
  CAST_AND_RETURN(jni::JFloat, cache.jFloat.clazz)
  CAST_AND_RETURN(react::WritableNativeArray::javaobject, cache.jWritableNativeArray)
  CAST_AND_RETURN(react::WritableNativeMap::javaobject, cache.jWritableNativeMap)
  CAST_AND_RETURN(JavaScriptModuleObject::javaobject, cache.jJavaScriptModuleObject)
  CAST_AND_RETURN(JSharedObject::javaobject, cache.jSharedObject)
  CAST_AND_RETURN(JavaScriptTypedArray::javaobject, cache.jJavaScriptTypedArray)

  CAST_AND_RETURN(jni::JMap<jstring COMMA jobject>, cache.jMap)
  CAST_AND_RETURN(jni::JCollection<jobject>, cache.jCollection)

  // Primitives arrays
  CAST_AND_RETURN(jni::JArrayDouble, cache.jDoubleArray)
  CAST_AND_RETURN(jni::JArrayBoolean, cache.jBooleanArray)
  CAST_AND_RETURN(jni::JArrayInt, cache.jIntegerArray)
  CAST_AND_RETURN(jni::JArrayLong, cache.jLongArray)
  CAST_AND_RETURN(jni::JArrayFloat, cache.jFloatArray)

#undef COMMA
#undef CAST_AND_RETURN

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
