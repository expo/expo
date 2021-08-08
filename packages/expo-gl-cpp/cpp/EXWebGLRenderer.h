#pragma once

#include <jsi/jsi.h>
#include <unordered_map>
#include "UEXGL.h"

namespace expo {
namespace gl_cpp {

struct initGlesContext {
  int32_t viewportWidth;
  int32_t viewportHeight;
};

namespace jsi = facebook::jsi;

class EXGLContext;

enum class EXWebGLClass {
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

void ensurePrototypes(jsi::Runtime& runtime);
void createWebGLRenderer(jsi::Runtime &runtime, EXGLContext *, initGlesContext);


} // namespace gl_cpp
} // namespace expo
