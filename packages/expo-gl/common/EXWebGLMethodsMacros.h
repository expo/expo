#pragma once

#include "pch.h"

#include "EXGLContextManager.h"
#include "EXGLImageUtils.h"
#include "EXJsiArgsTransform.h"
#include "EXWebGLMethodsHelpers.h"
#include "EXWebGLRenderer.h"

#include <algorithm>

namespace expo {
namespace gl_cpp {
namespace method {

inline ContextWithLock getContext(jsi::Runtime &runtime, const jsi::Value &jsThis) {
  double exglCtxId = jsThis.asObject(runtime).getProperty(runtime, "contextId").asNumber();
  return ContextGet(static_cast<EXGLContextId>(exglCtxId));
}

} // namespace method
} // namespace gl_cpp
} // namespace expo

#define ARG(index, type)                                   \
  (argc > index ? unpackArg<type>(runtime, jsArgv + index) \
                : throw std::runtime_error("EXGL: Too few arguments"))

#define CTX()                                \
  auto result = getContext(runtime, jsThis); \
  auto ctx = result.first;                   \
  if (ctx == nullptr) {                      \
    return jsi::Value::undefined();          \
  }

#define NATIVE_METHOD(name, ...)    \
  jsi::Value glNativeMethod_##name( \
      jsi::Runtime &runtime, const jsi::Value &jsThis, const jsi::Value *jsArgv, size_t argc)

#define SIMPLE_NATIVE_METHOD(name, func)                                    \
  NATIVE_METHOD(name) {                                                     \
    CTX();                                                                  \
    ctx->addToNextBatch(generateNativeMethod(runtime, func, jsArgv, argc)); \
    return nullptr;                                                         \
  }

#define UNIMPL_NATIVE_METHOD(name)   \
  NATIVE_METHOD(name) {              \
    return exglUnimplemented(#name); \
  }
