#pragma once

#include "pch.h"

#include "EXGLNativeApi.h"

namespace expo {
namespace gl_cpp {

struct glesContext {
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

// Installs the WebGLRenderingContext and WebGL2RenderingContext constructors,
// their numeric constants, and the inheritance chain for related interface
// objects. Safe to call before any GL context exists; idempotent.
void installWebGLConstructorsAndConstants(jsi::Runtime &runtime);

// Installs WebGLRenderingContext and WebGL2RenderingContext instance methods
// on their prototypes. Defers the heavier per-method binding work until a GL
// context is created. Requires `installWebGLConstructorsAndConstants` to have
// run; idempotent.
void installWebGLInstanceMethods(jsi::Runtime &runtime);

void createWebGLRenderer(jsi::Runtime &runtime, EXGLContext *, glesContext, jsi::Object &&global);

jsi::Value createWebGLObject(
  jsi::Runtime &runtime,
  EXWebGLClass webglClass,
  std::initializer_list<jsi::Value> &&args);

std::string getConstructorName(EXWebGLClass value);

} // namespace gl_cpp
} // namespace expo
