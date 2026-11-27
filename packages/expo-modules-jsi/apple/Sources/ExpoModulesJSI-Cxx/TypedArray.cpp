// Copyright 2022-present 650 Industries. All rights reserved.

#include <cstring>
#include <stdexcept>
#include "TypedArray.h"

namespace expo {

namespace {

TypedArrayKind getTypedArrayKindForName(const std::string &name) noexcept {
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
  return TypedArrayKind::Unknown;
}

} // namespace

TypedArrayKind getTypedArrayKind(
  jsi::IRuntime &runtime,
  const jsi::Object &jsObj,
  const jsi::Function &toStringTagGetter
) noexcept {
  try {
    jsi::Value tag = toStringTagGetter.callWithThis(runtime, jsObj);
    if (tag.isString()) {
      return getTypedArrayKindForName(std::move(tag).getString(runtime).utf8(runtime));
    }
  } catch (const jsi::JSIException &) {
  }
  return TypedArrayKind::Unknown;
}

TypedArrayProperties getFallbackTypedArrayProperties(
  jsi::IRuntime &runtime,
  const jsi::Object &jsObj,
  const jsi::Function &byteLengthGetter,
  const jsi::Function &byteOffsetGetter,
  const jsi::Function &lengthGetter
) {
  return {
    static_cast<size_t>(byteLengthGetter.callWithThis(runtime, jsObj).getNumber()),
    static_cast<size_t>(byteOffsetGetter.callWithThis(runtime, jsObj).getNumber()),
    static_cast<size_t>(lengthGetter.callWithThis(runtime, jsObj).getNumber()),
  };
}

jsi::ArrayBuffer getFallbackTypedArrayBuffer(
  jsi::IRuntime &runtime,
  const jsi::Object &jsObj,
  const jsi::Function &bufferGetter
) {
  jsi::Value buffer = bufferGetter.callWithThis(runtime, jsObj);
  if (buffer.isObject()) {
    jsi::Object bufferObject = std::move(buffer).getObject(runtime);
    if (bufferObject.isArrayBuffer(runtime)) {
      return std::move(bufferObject).getArrayBuffer(runtime);
    }
  }
  throw std::runtime_error("no ArrayBuffer attached");
}

bool isTypedArray(jsi::IRuntime &runtime, const jsi::Object &jsObj) noexcept {
#if EXPO_JSI_HAS_RN_086
  try {
    return runtime.isTypedArray(jsObj);
  } catch (const jsi::JSIException &) {
    return false;
  }
#else
  try {
    jsi::Object objectCtor = runtime.global().getPropertyAsObject(runtime, "Object");
    jsi::Object uint8Proto = runtime.global()
      .getPropertyAsObject(runtime, "Uint8Array")
      .getPropertyAsObject(runtime, "prototype");
    jsi::Value typedArrayProto = uint8Proto.getPrototype(runtime);
    if (!typedArrayProto.isObject()) {
      return false;
    }
    jsi::Value toStringTag = runtime.global()
      .getPropertyAsObject(runtime, "Symbol")
      .getProperty(runtime, "toStringTag");
    jsi::Value descriptor = objectCtor
      .getPropertyAsFunction(runtime, "getOwnPropertyDescriptor")
      .callWithThis(runtime, objectCtor, std::move(typedArrayProto), toStringTag);
    if (!descriptor.isObject()) {
      return false;
    }
    jsi::Value getterVal = std::move(descriptor).getObject(runtime).getProperty(runtime, "get");
    if (!getterVal.isObject()) {
      return false;
    }
    jsi::Object getterObj = std::move(getterVal).getObject(runtime);
    if (!getterObj.isFunction(runtime)) {
      return false;
    }
    return getTypedArrayKind(runtime, jsObj, std::move(getterObj).getFunction(runtime)) != TypedArrayKind::Unknown;
  } catch (const jsi::JSIException &) {
    return false;
  }
#endif
}

} // namespace expo
