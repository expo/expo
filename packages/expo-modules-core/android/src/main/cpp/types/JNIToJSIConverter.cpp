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
    return jsi::Value::undefined();
  }
  auto unpackedValue = value.get();
  auto cache = JavaReferencesCache::instance();

#define CAST_AND_RETURN(type, classId) \
  if (env->IsInstanceOf(unpackedValue, cache->getJClass(#classId).clazz)) { \
    return convertToJS(rt, jni::static_ref_cast<type>(value)); \
  }

  CAST_AND_RETURN(jni::JDouble, java/lang/Double)
  CAST_AND_RETURN(jni::JInteger, java/lang/Integer)
  CAST_AND_RETURN(jni::JLong, java/lang/Long)
  CAST_AND_RETURN(jni::JString, java/lang/String)
  CAST_AND_RETURN(jni::JBoolean, java/lang/Boolean)
  CAST_AND_RETURN(jni::JFloat, java/lang/Float)
  CAST_AND_RETURN(react::WritableNativeArray::javaobject, com/facebook/react/bridge/WritableNativeArray)
  CAST_AND_RETURN(react::WritableNativeMap::javaobject, com/facebook/react/bridge/WritableNativeMap)
  CAST_AND_RETURN(JavaScriptModuleObject::javaobject, expo/modules/kotlin/jni/JavaScriptModuleObject)
  CAST_AND_RETURN(JSharedObject::javaobject, expo/modules/kotlin/sharedobjects/SharedObject)
  CAST_AND_RETURN(JavaScriptTypedArray::javaobject, expo/modules/kotlin/jni/JavaScriptTypedArray)

  if (env->IsInstanceOf(unpackedValue, cache->getJClass("java/util/List").clazz)) {
    return convertToJS(rt, jni::static_ref_cast<jni::JList<jobject>>(value));
  }

  // Primitives arrays
  CAST_AND_RETURN(jni::JArrayDouble, [D)
  CAST_AND_RETURN(jni::JArrayBoolean, [Z)
  CAST_AND_RETURN(jni::JArrayInt, [I)
  CAST_AND_RETURN(jni::JArrayLong, [J)
  CAST_AND_RETURN(jni::JArrayFloat, [F)

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
