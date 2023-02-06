#pragma once

#include <ABI48_0_0jsi/ABI48_0_0jsi.h>
#include <unordered_map>
#include "ABI48_0_0EXGLNativeApi.h"

namespace ABI48_0_0expo {
namespace gl_cpp {

struct initGlesContext {
  int32_t viewportWidth;
  int32_t viewportHeight;
};

namespace jsi = ABI48_0_0facebook::jsi;

class ABI48_0_0EXGLContext;

enum class ABI48_0_0EXWebGLClass {
  WebGLRenderingContext,
  WebGL2RenderingContext,
  WebGLObject,
  WebGLBuffer,
  WebGLFramebuffer,
  WebGLProgram,
  WebGLRenderbuffer,
  WebGLShader,
  WebGLTexture,
  WebGLUniformLocation,
  WebGLActiveInfo,
  WebGLShaderPrecisionFormat,
  WebGLQuery,
  WebGLSampler,
  WebGLSync,
  WebGLTransformFeedback,
  WebGLVertexArrayObject,
};

void ensurePrototypes(jsi::Runtime &runtime);
void createWebGLRenderer(jsi::Runtime &runtime, ABI48_0_0EXGLContext *, initGlesContext, jsi::Object&& global);
jsi::Value createWebGLObject(
    jsi::Runtime &runtime,
    ABI48_0_0EXWebGLClass webglClass,
    std::initializer_list<jsi::Value> &&args);
std::string getConstructorName(ABI48_0_0EXWebGLClass value);

} // namespace gl_cpp
} // namespace ABI48_0_0expo
