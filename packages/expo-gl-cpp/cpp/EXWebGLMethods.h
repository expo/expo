#pragma once

#include "EXGLContext.h"

namespace expo {
namespace gl_cpp {
namespace method {

#define NATIVE_METHOD(name) \
  jsi::Value glNativeMethod_##name(jsi::Runtime &, const jsi::Value &, const jsi::Value *, size_t);
#define NATIVE_WEBGL2_METHOD(name) NATIVE_METHOD(name)
#include "EXWebGLMethods.def"
#undef NATIVE_WEBGL2_METHOD
#undef NATIVE_METHOD

} // namespace method
} // namespace gl_cpp
} // namespace expo
