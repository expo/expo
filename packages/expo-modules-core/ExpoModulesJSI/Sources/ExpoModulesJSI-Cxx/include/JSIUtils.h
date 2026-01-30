// Copyright 2022-present 650 Industries. All rights reserved.

#pragma once
#ifdef __cplusplus

#include <jsi/jsi.h>
#include <hermes/hermes.h>
#include "HostFunctionClosure.h"
#include "CppError.h"

namespace jsi = facebook::jsi;

namespace expo {

inline jsi::Value valueFromFunction(jsi::Runtime &runtime, const jsi::Function &function) {
  return jsi::Value(runtime, function);
}

// `jsi::Object::setProperty` is a template function that Swift does not support. We need to provide specialized versions.
inline void setProperty(jsi::Runtime &runtime, const jsi::Object &object, const char *name, bool value) {
  object.setProperty(runtime, name, value);
}

inline void setProperty(jsi::Runtime &runtime, const jsi::Object &object, const char *name, double value) {
  object.setProperty(runtime, name, value);
}

inline void setProperty(jsi::Runtime &runtime, const jsi::Object &object, const char *name, const jsi::Value value) {
  object.setProperty(runtime, name, value);
}

inline void setValueAtIndex(jsi::Runtime &runtime, const jsi::Array &array, size_t index, const jsi::Value value) {
  array.setValueAtIndex(runtime, index, value);
}

inline jsi::Value valueFromArray(jsi::Runtime &runtime, const jsi::Array &array) {
  return jsi::Value(runtime, array);
}

inline const jsi::Value valueFromError(jsi::Runtime &runtime, const jsi::JSError &error) {
  return jsi::Value(runtime, error.value());
}

inline std::shared_ptr<const jsi::Buffer> makeSharedStringBuffer(const std::string &source) noexcept {
  return std::make_shared<jsi::StringBuffer>(source);
}

inline jsi::Function createHostFunction(jsi::Runtime &runtime, const char *name, HostFunctionClosure *closure) {
  jsi::PropNameID propName = jsi::PropNameID::forAscii(runtime, name);
  return jsi::Function::createFromHostFunction(runtime, propName, 0, [closure](jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *_Nonnull args, size_t count) -> jsi::Value {
    return closure->call(thisValue, args, count);
  });
}

inline const jsi::Runtime& createHermesRuntime() {
  std::unique_ptr<facebook::hermes::HermesRuntime> runtimePtr = facebook::hermes::makeHermesRuntime();
  jsi::Runtime *runtime = runtimePtr.release();

  // This version of the Hermes uses a Promise implementation that is provided by the RN.
  // The `setImmediate` function isn't defined, but is required by the Promise implementation.
  // That's why we inject it here.
  auto setImmediatePropName = jsi::PropNameID::forUtf8(*runtime, "setImmediate");
  auto setImmediateFunction = jsi::Function::createFromHostFunction(*runtime, setImmediatePropName, 1, [](jsi::Runtime &rt, const jsi::Value &thisVal, const jsi::Value *args, size_t count) {
    args[0].asObject(rt).asFunction(rt).call(rt);
    return jsi::Value::undefined();
  });
  runtime->global().setProperty(*runtime, setImmediatePropName, setImmediateFunction);

  return *runtime;
}

inline jsi::Value evaluateJavaScript(jsi::Runtime &runtime, const std::shared_ptr<const jsi::Buffer>& buffer, const std::string& sourceURL) {
  return expo::CppError::tryCatch(^{
    return runtime.evaluateJavaScript(buffer, sourceURL);
  });
}

inline jsi::Value callFunction(jsi::Runtime &runtime, const jsi::Function &function, const jsi::Value *args, size_t count) {
  return expo::CppError::tryCatch(^{
    return function.call(runtime, args, count);
  });
}

inline jsi::Value callFunctionWithThis(jsi::Runtime &runtime, const jsi::Function &function, const jsi::Object &jsThis, const jsi::Value *args, size_t count) {
  return expo::CppError::tryCatch(^{
    return function.callWithThis(runtime, jsThis, args, count);
  });
}

inline jsi::Value callAsConstructor(jsi::Runtime &runtime, const jsi::Function &function, const jsi::Value *args, size_t count) {
  return expo::CppError::tryCatch(^{
    return function.callAsConstructor(runtime, args, count);
  });
}

} // namespace expo

#endif // __cplusplus
