#pragma once

#include "ABI46_0_0EXGLContext.h"

namespace ABI46_0_0expo {
namespace gl_cpp {
namespace method {

#define NATIVE_METHOD(name) \
  jsi::Value glNativeMethod_##name(jsi::Runtime &, const jsi::Value &, const jsi::Value *, size_t);
#define NATIVE_WEBGL2_METHOD(name) NATIVE_METHOD(name)
#include "ABI46_0_0EXWebGLMethods.def"
#undef NATIVE_WEBGL2_METHOD
#undef NATIVE_METHOD

} // namespace method
} // namespace gl_cpp
} // namespace ABI46_0_0expo
