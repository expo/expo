#include "EXWebGLRenderer.h"
#include "EXGLContext.h"
#include "EXGLContextManager.h"
#include "EXJsiUtils.h"
#include "EXWebGLMethods.h"

namespace expo {
namespace gl_cpp {

constexpr const char *EXGLContextsMapPropertyName = "__EXGLContexts";

void installConstants(jsi::Runtime &runtime, jsi::Object &gl);
void installWebGLMethods(jsi::Runtime &runtime, jsi::Object &&gl);
void installWebGL2Methods(jsi::Runtime &runtime, jsi::Object &&gl);
std::string getConstructorName(EXWebGLClass value);

void createWebGLRenderer(jsi::Runtime &runtime, EXGLContext *ctx, initGlesContext viewport) {
  jsi::Value constructor = ctx->supportsWebGL2
      ? runtime.global().getProperty(
            runtime,
            jsi::PropNameID::forUtf8(
                runtime, getConstructorName(EXWebGLClass::WebGL2RenderingContext)))
      : runtime.global().getProperty(
            runtime,
            jsi::PropNameID::forUtf8(
                runtime, getConstructorName(EXWebGLClass::WebGLRenderingContext)));
  jsi::Object gl = std::move(constructor)
                       .asObject(runtime)
                       .asFunction(runtime)
                       .callAsConstructor(runtime, {static_cast<double>(ctx->ctxId)})
                       .asObject(runtime);

  gl.setProperty(runtime, "drawingBufferWidth", viewport.viewportWidth);
  gl.setProperty(runtime, "drawingBufferHeight", viewport.viewportHeight);
  gl.setProperty(runtime, "supportsWebGL2", ctx->supportsWebGL2);
  gl.setProperty(runtime, "exglCtxId", static_cast<double>(ctx->ctxId));
  installConstants(runtime, gl);

  jsi::Value jsContextMap = runtime.global().getProperty(runtime, EXGLContextsMapPropertyName);
  auto global = runtime.global();
  if (jsContextMap.isNull() || jsContextMap.isUndefined()) {
    global.setProperty(runtime, EXGLContextsMapPropertyName, jsi::Object(runtime));
  }
  global.getProperty(runtime, EXGLContextsMapPropertyName)
      .asObject(runtime)
      .setProperty(runtime, jsi::PropNameID::forUtf8(runtime, std::to_string(ctx->ctxId)), gl);
}

std::string getConstructorName(EXWebGLClass value) {
  switch (value) {
    case EXWebGLClass::WebGLRenderingContext:
      return "WebGLRenderingContext";
    case EXWebGLClass::WebGL2RenderingContext:
      return "WebGL2RenderingContext";
    case EXWebGLClass::WebGLObject:
      return "WebGLObject";
    case EXWebGLClass::WebGLBuffer:
      return "WebGLBuffer";
    case EXWebGLClass::WebGLFramebuffer:
      return "WebGLFramebuffer";
    case EXWebGLClass::WebGLProgram:
      return "WebGLProgram";
    case EXWebGLClass::WebGLRenderbuffer:
      return "WebGLRenderbuffer";
    case EXWebGLClass::WebGLShader:
      return "WebGLShader";
    case EXWebGLClass::WebGLTexture:
      return "WebGLTexture";
    case EXWebGLClass::WebGLUniformLocation:
      return "WebGLUniformLocation";
    case EXWebGLClass::WebGLActiveInfo:
      return "WebGLActiveInfo";
    case EXWebGLClass::WebGLShaderPrecisionFormat:
      return "WebGLShaderPrecisionFormat";
    case EXWebGLClass::WebGLQuery:
      return "WebGLQuery";
    case EXWebGLClass::WebGLSampler:
      return "WebGLSampler";
    case EXWebGLClass::WebGLSync:
      return "WebGLSync";
    case EXWebGLClass::WebGLTransformFeedback:
      return "WebGLTransformFeedback";
    case EXWebGLClass::WebGLVertexArrayObject:
      return "WebGLVertexArrayObject";
  }
}

void attachClass(jsi::Runtime &runtime, EXWebGLClass webglClass, std::function<void(jsi::Runtime &runtime, jsi::Object &&gl)> installPrototypes) {
  jsi::PropNameID name = jsi::PropNameID::forUtf8(runtime, getConstructorName(webglClass));
  auto constructor = jsi::Function::createFromHostFunction(
      runtime,
      name,
      0,
      [](jsi::Runtime &runtime, const jsi::Value &jsThis, const jsi::Value *jsArgv, size_t argc) {
        if (argc <= 0) {
          throw std::runtime_error("missing id");
        }
        jsi::Object object(runtime);
        object.setProperty(runtime, "id", jsArgv[0]);
        return object;
      });
  runtime.global().setProperty(runtime, name, constructor);
  installPrototypes(runtime, constructor.getProperty(runtime, "prototype").asObject(runtime));
}


void ensurePrototypes(jsi::Runtime &runtime) {
  if (runtime.global().hasProperty(runtime, "__EXGLConstructorReady")) {
    return;
  }
  runtime.global().setProperty(runtime, "__EXGLConstructorReady", true);
  auto dummyFunc = [](jsi::Runtime &, jsi::Object &&) {};
  attachClass(runtime, EXWebGLClass::WebGLRenderingContext, installWebGLMethods);
  attachClass(runtime, EXWebGLClass::WebGL2RenderingContext, installWebGL2Methods);
  attachClass(runtime, EXWebGLClass::WebGLObject, dummyFunc);
  attachClass(runtime, EXWebGLClass::WebGLBuffer, dummyFunc);
  attachClass(runtime, EXWebGLClass::WebGLFramebuffer, dummyFunc);
  attachClass(runtime, EXWebGLClass::WebGLProgram, dummyFunc);
  attachClass(runtime, EXWebGLClass::WebGLRenderbuffer, dummyFunc);
  attachClass(runtime, EXWebGLClass::WebGLShader, dummyFunc);
  attachClass(runtime, EXWebGLClass::WebGLTexture, dummyFunc);
  attachClass(runtime, EXWebGLClass::WebGLUniformLocation, dummyFunc);
  attachClass(runtime, EXWebGLClass::WebGLActiveInfo, dummyFunc);
  attachClass(runtime, EXWebGLClass::WebGLShaderPrecisionFormat, dummyFunc);
  attachClass(runtime, EXWebGLClass::WebGLQuery, dummyFunc);
  attachClass(runtime, EXWebGLClass::WebGLSampler, dummyFunc);
  attachClass(runtime, EXWebGLClass::WebGLSync, dummyFunc);
  attachClass(runtime, EXWebGLClass::WebGLTransformFeedback, dummyFunc);
  attachClass(runtime, EXWebGLClass::WebGLVertexArrayObject, dummyFunc);
}

void installConstants(jsi::Runtime &runtime, jsi::Object &gl) {
#define GL_CONSTANT(name) gl.setProperty(runtime, #name, static_cast<double>(GL_##name));
#include "EXGLConstants.def"
#undef GL_CONSTANT
}

void installWebGLMethods(jsi::Runtime &runtime, jsi::Object &&gl) {
#define NATIVE_METHOD(name) setFunctionOnObject(runtime, gl, #name, method::glNativeMethod_##name);

#define NATIVE_WEBGL2_METHOD(name) ;
#include "EXWebGLMethods.def"
#undef NATIVE_WEBGL2_METHOD
#undef NATIVE_METHOD
}

void installWebGL2Methods(jsi::Runtime &runtime, jsi::Object &&gl) {
#define CREATE_METHOD(name) setFunctionOnObject(runtime, gl, #name, method::glNativeMethod_##name);

#define NATIVE_METHOD(name) CREATE_METHOD(name)
#define NATIVE_WEBGL2_METHOD(name) CREATE_METHOD(name)
#include "EXWebGLMethods.def"
#undef NATIVE_WEBGL2_METHOD
#undef NATIVE_METHOD
#undef CREATE_METHOD
}

} // namespace gl_cpp
} // namespace expo
