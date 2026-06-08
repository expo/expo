// Copyright 2022-present 650 Industries. All rights reserved.

#include <unordered_map>
#include "TypedArray.h"

namespace expo {

std::unordered_map<std::string, TypedArrayKind> nameToKindMap = {
    {"Int8Array", TypedArrayKind::Int8Array},
    {"Int16Array", TypedArrayKind::Int16Array},
    {"Int32Array", TypedArrayKind::Int32Array},
    {"Uint8Array", TypedArrayKind::Uint8Array},
    {"Uint8ClampedArray", TypedArrayKind::Uint8ClampedArray},
    {"Uint16Array", TypedArrayKind::Uint16Array},
    {"Uint32Array", TypedArrayKind::Uint32Array},
    {"Float32Array", TypedArrayKind::Float32Array},
    {"Float64Array", TypedArrayKind::Float64Array},
    {"BigInt64Array", TypedArrayKind::BigInt64Array},
    {"BigUint64Array", TypedArrayKind::BigUint64Array},
};

TypedArrayKind getTypedArrayKindForName(const std::string &name) {
  return nameToKindMap.at(name);
}

TypedArrayKind getTypedArrayKind(jsi::IRuntime &runtime, const jsi::Object &jsObj) {
  auto constructorName = jsObj.getPropertyAsObject(runtime, "constructor")
                             .getProperty(runtime, "name")
                             .asString(runtime)
                             .utf8(runtime);
  return getTypedArrayKindForName(constructorName);
}

jsi::ArrayBuffer getTypedArrayBuffer(jsi::IRuntime &runtime, const jsi::Object &jsObj) {
  auto buffer = jsObj.getProperty(runtime, "buffer");
  if (buffer.isObject() && buffer.asObject(runtime).isArrayBuffer(runtime)) {
    return buffer.asObject(runtime).getArrayBuffer(runtime);
  }
  throw std::runtime_error("no ArrayBuffer attached");
}

bool isTypedArray(jsi::IRuntime &runtime, const jsi::Object &jsObj) {
  jsi::Object ArrayBuffer = runtime
    .global()
    .getPropertyAsObject(runtime, "ArrayBuffer");

  jsi::Value isViewResult = ArrayBuffer
    .getPropertyAsFunction(runtime, "isView")
    .callWithThis(runtime, ArrayBuffer, {jsi::Value(runtime, jsObj)});

  return isViewResult.getBool();
}

} // namespace expo
