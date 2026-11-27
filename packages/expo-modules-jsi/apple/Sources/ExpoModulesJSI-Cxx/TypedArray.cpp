// Copyright 2022-present 650 Industries. All rights reserved.

#include <cstdlib>
#include <cstring>
#include <new>
#include <stdexcept>
#include "TypedArray.h"

namespace expo {

namespace {

class TypedArrayPointerAccess : public jsi::Runtime {
 public:
  TypedArrayPointerAccess() = delete;

#if EXPO_JSI_HAS_RN_086
  static jsi::TypedArray borrowTypedArray(const jsi::Object &object) noexcept {
    return make<jsi::TypedArray>(const_cast<PointerValue *>(getPointerValue(object)));
  }
#endif
};

TypedArrayKind getTypedArrayKindForName(const std::string &name) {
  const char *data = name.data();
  switch (name.size()) {
    case 9:
      if (std::memcmp(data, "Int8Array", 9) == 0) {
        return TypedArrayKind::Int8Array;
      }
      break;
    case 10:
      if (std::memcmp(data, "Uint8Array", 10) == 0) {
        return TypedArrayKind::Uint8Array;
      }
      if (std::memcmp(data, "Int16Array", 10) == 0) {
        return TypedArrayKind::Int16Array;
      }
      if (std::memcmp(data, "Int32Array", 10) == 0) {
        return TypedArrayKind::Int32Array;
      }
      break;
    case 11:
      if (std::memcmp(data, "Uint16Array", 11) == 0) {
        return TypedArrayKind::Uint16Array;
      }
      if (std::memcmp(data, "Uint32Array", 11) == 0) {
        return TypedArrayKind::Uint32Array;
      }
      break;
    case 12:
      if (std::memcmp(data, "Float32Array", 12) == 0) {
        return TypedArrayKind::Float32Array;
      }
      if (std::memcmp(data, "Float64Array", 12) == 0) {
        return TypedArrayKind::Float64Array;
      }
      break;
    case 13:
      if (std::memcmp(data, "BigInt64Array", 13) == 0) {
        return TypedArrayKind::BigInt64Array;
      }
      break;
    case 14:
      if (std::memcmp(data, "BigUint64Array", 14) == 0) {
        return TypedArrayKind::BigUint64Array;
      }
      break;
    case 17:
      if (std::memcmp(data, "Uint8ClampedArray", 17) == 0) {
        return TypedArrayKind::Uint8ClampedArray;
      }
      break;
    default:
      break;
  }
  throw std::out_of_range("Unknown TypedArray kind: " + name);
}

} // namespace

TypedArrayKind getTypedArrayKind(
  jsi::IRuntime &runtime,
  const jsi::Object &jsObj,
  const jsi::PropNameID &constructorPropName,
  const jsi::PropNameID &namePropName
) {
  auto constructorName = jsObj.getProperty(runtime, constructorPropName)
                             .asObject(runtime)
                             .getProperty(runtime, namePropName)
                             .asString(runtime)
                             .utf8(runtime);
  return getTypedArrayKindForName(constructorName);
}

jsi::ArrayBuffer getTypedArrayBuffer(
  jsi::IRuntime &runtime,
  const jsi::Object &jsObj,
  [[maybe_unused]] const jsi::PropNameID &bufferPropName
) {
#if EXPO_JSI_HAS_RN_086
  return getNativeTypedArrayBuffer(runtime, jsObj);
#else
  auto buffer = jsObj.getProperty(runtime, bufferPropName);
  if (buffer.isObject()) {
    // Move the handle on rather than cloning it, since `buffer` isn't used afterwards.
    auto bufferObject = std::move(buffer).getObject(runtime);
    if (bufferObject.isArrayBuffer(runtime)) {
      return std::move(bufferObject).getArrayBuffer(runtime);
    }
  }
  throw std::runtime_error("no ArrayBuffer attached");
#endif
}

TypedArrayProperties getNativeTypedArrayProperties(
  [[maybe_unused]] jsi::IRuntime &runtime,
  [[maybe_unused]] const jsi::Object &jsObj
) {
#if EXPO_JSI_HAS_RN_086
  alignas(jsi::TypedArray) unsigned char storage[sizeof(jsi::TypedArray)];
  const jsi::TypedArray *ta = new (storage) jsi::TypedArray(TypedArrayPointerAccess::borrowTypedArray(jsObj));
  return {
    runtime.byteLength(*ta),
    runtime.byteOffset(*ta),
    runtime.length(*ta),
  };
#else
  std::abort();
#endif
}

jsi::ArrayBuffer getNativeTypedArrayBuffer(
  [[maybe_unused]] jsi::IRuntime &runtime,
  [[maybe_unused]] const jsi::Object &jsObj
) {
#if EXPO_JSI_HAS_RN_086
  alignas(jsi::TypedArray) unsigned char storage[sizeof(jsi::TypedArray)];
  const jsi::TypedArray *ta = new (storage) jsi::TypedArray(TypedArrayPointerAccess::borrowTypedArray(jsObj));
  return runtime.buffer(*ta);
#else
  std::abort();
#endif
}

bool isTypedArray(jsi::IRuntime &runtime, const jsi::Object &jsObj) {
#if EXPO_JSI_HAS_RN_086
  return runtime.isTypedArray(jsObj);
#else
  try {
    jsi::Object uint8Array = runtime.global().getPropertyAsObject(runtime, "Uint8Array");
    jsi::Value typedArrayProto = uint8Array.getPrototype(runtime);
    if (!typedArrayProto.isObject()) {
      return false;
    }
    jsi::Object typedArrayCtor = std::move(typedArrayProto).getObject(runtime);
    if (!typedArrayCtor.isFunction(runtime)) {
      return false;
    }
    return jsObj.instanceOf(runtime, std::move(typedArrayCtor).getFunction(runtime));
  } catch (const jsi::JSIException &) {
    return false;
  }
#endif
}

} // namespace expo
