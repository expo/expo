#pragma once

#include <jsi/jsi.h>
#include <vector>

namespace jsi = facebook::jsi;

template <typename T>
inline std::vector<T> jsArrayToVector(jsi::Runtime &runtime, const jsi::Array &jsArray) {
  int length = jsArray.length(runtime);
  std::vector<T> values(length);

  for (int i = 0; i < length; i++) {
    values[i] = static_cast<T>(jsArray.getValueAtIndex(runtime, i).asNumber());
  }
  return values;
}

template <>
inline std::vector<std::string> jsArrayToVector(jsi::Runtime &runtime, const jsi::Array &jsArray) {
  int length = jsArray.length(runtime);
  std::vector<std::string> strings(length);

  for (int i = 0; i < length; i++) {
    strings[i] = jsArray.getValueAtIndex(runtime, i).asString(runtime).utf8(runtime);
  }
  return strings;
}

inline std::vector<uint8_t> rawArrayBuffer(jsi::Runtime &runtime, const jsi::Object &arr) {
  if (arr.isArrayBuffer(runtime)) {
    auto buffer = arr.getArrayBuffer(runtime);
    return buffer.data(runtime);
  } else if (arr.isTypedArray(runtime)) {
    auto buffer = arr.getTypedArray(runtime).getBuffer(runtime);
    return buffer.data(runtime);
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

inline void jsConsoleLog(jsi::Runtime &runtime, const std::string &msg) {
  runtime.global()
      .getProperty(runtime, "console")
      .asObject(runtime)
      .getProperty(runtime, "log")
      .asObject(runtime)
      .asFunction(runtime)
      .call(runtime, {jsi::String::createFromUtf8(runtime, msg)});
}

inline jsi::Value unsupportedWebGL2(
    const std::string &name,
    jsi::Runtime &runtime,
    const jsi::Value &jsThis,
    const jsi::Value *jsArgv,
    size_t argc) {
  throw std::runtime_error("EXGL: This device doesn't support WebGL2 method: " + name + "()!");
}

// tmp move it somewhere
#ifdef __APPLE__
#include <EXGL_CPP/EXiOSUtils.h>
#endif

#ifdef __ANDROID__
#include <android/log.h>
#endif

#define EXGL_DEBUG // Whether debugging is on

#ifdef EXGL_DEBUG
#ifdef __ANDROID__
#define EXGLSysLog(fmt, ...) __android_log_print(ANDROID_LOG_ERROR, "EXGL", fmt, ##__VA_ARGS__)
#endif
#ifdef __APPLE__
#define EXGLSysLog(fmt, ...) EXiOSLog("EXGL: " fmt, ##__VA_ARGS__)
#endif
#else
#define EXGLSysLog(...)
#endif
