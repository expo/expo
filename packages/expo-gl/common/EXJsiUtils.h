#pragma once

#include <jsi/jsi.h>
#include <vector>

#include "EXPlatformUtils.h"
#include "EXTypedArrayApi.h"

namespace expo {
namespace gl_cpp {
namespace jsi = facebook::jsi;

template <typename T>
inline std::vector<T> jsArrayToVector(jsi::Runtime &runtime, const jsi::Array &jsArray) {
  size_t length = jsArray.length(runtime);
  std::vector<T> values(length);

  for (size_t i = 0; i < length; i++) {
    values[i] = static_cast<T>(jsArray.getValueAtIndex(runtime, i).asNumber());
  }
  return values;
}

template <>
inline std::vector<std::string> jsArrayToVector(jsi::Runtime &runtime, const jsi::Array &jsArray) {
  size_t length = jsArray.length(runtime);
  std::vector<std::string> strings(length);

  for (size_t i = 0; i < length; i++) {
    strings[i] = jsArray.getValueAtIndex(runtime, i).asString(runtime).utf8(runtime);
  }
  return strings;
}

inline std::vector<uint8_t> rawTypedArray(jsi::Runtime &runtime, const jsi::Object &arr) {
  if (arr.isArrayBuffer(runtime)) {
    auto buffer = arr.getArrayBuffer(runtime);
    return arrayBufferToVector(runtime, buffer);
  } else if (isTypedArray(runtime, arr)) {
    return getTypedArray(runtime, arr).toVector(runtime);
  }
  throw std::runtime_error("Object is not an ArrayBuffer nor a TypedArray");
}

inline bool jsValueToBool(jsi::Runtime &runtime, const jsi::Value &jsValue) {
  return jsValue.isBool()
      ? jsValue.getBool()
      : throw std::runtime_error(jsValue.toString(runtime).utf8(runtime) + " is not a bool value");
}

template <typename Func>
inline void setFunctionOnObject(
    jsi::Runtime &runtime,
    jsi::Object &jsObject,
    const std::string &name,
    Func func) {
  auto jsName = jsi::PropNameID::forUtf8(runtime, name);
  jsObject.setProperty(
      runtime, jsName, jsi::Function::createFromHostFunction(runtime, jsName, 0, func));
}

inline void jsConsoleLog(jsi::Runtime &runtime, std::initializer_list<jsi::Value> args) {
  runtime.global()
      .getProperty(runtime, "console")
      .asObject(runtime)
      .getProperty(runtime, "log")
      .asObject(runtime)
      .asFunction(runtime)
      .call(runtime, args);
}

inline jsi::Value unsupportedWebGL2(
    const std::string &name,
    jsi::Runtime &runtime,
    const jsi::Value &jsThis,
    const jsi::Value *jsArgv,
    size_t argc) {
  throw std::runtime_error("EXGL: This device doesn't support WebGL2 method: " + name + "()!");
}

} // namespace gl_cpp
} // namespace expo
