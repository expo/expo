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

void ensurePrototypes(jsi::Runtime &runtime);
void createWebGLRenderer(jsi::Runtime &runtime, EXGLContext *, initGlesContext, jsi::Object&& global);
jsi::Value createWebGLObject(
    jsi::Runtime &runtime,
    EXWebGLClass webglClass,
    std::initializer_list<jsi::Value> &&args);
std::string getConstructorName(EXWebGLClass value);

} // namespace gl_cpp
} // namespace expo
