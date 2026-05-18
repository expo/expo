#include "EXWebGLRenderer.h"
#include "EXGLNativeContext.h"
#include "EXGLContextManager.h"
#include "EXJsiUtils.h"
#include "EXWebGLMethods.h"
#include <jsi/jsi.h>

namespace expo {
namespace gl_cpp {

constexpr const char *EXGLContextsMapPropertyName = "__EXGLContexts";

// There is no way to crate function that can be used as constructor
// using jsi api, so we need to set it up via eval, it will be called
// only once so perofmance impact should be minimal
constexpr const char *evalStubConstructors = R"(
WebGLRenderingContext = function() {};
WebGL2RenderingContext = function() {};
WebGLObject = function() {};
WebGLBuffer = function() {};
WebGLFramebuffer = function() {};
WebGLProgram = function() {};
WebGLRenderbuffer = function() {};
WebGLShader = function() {};
WebGLTexture = function() {};
WebGLUniformLocation = function() {};
WebGLActiveInfo = function() {};
WebGLShaderPrecisionFormat = function() {};
WebGLQuery = function() {};
WebGLSampler = function() {};
WebGLSync = function() {};
WebGLTransformFeedback = function() {};
WebGLVertexArrayObject = function() {};
)";

void installConstants(jsi::Runtime &runtime, jsi::Object &gl);
void installWebGLMethods(jsi::Runtime &runtime, jsi::Object &gl);
void installWebGL2Methods(jsi::Runtime &runtime, jsi::Object &gl);

void createWebGLRenderer(jsi::Runtime &runtime, EXGLContext *ctx, glesContext viewport, jsi::Object&& global) {
  ensurePrototypes(runtime);
  jsi::Object gl = ctx->supportsWebGL2
    ? createWebGLObject(
          runtime, EXWebGLClass::WebGL2RenderingContext, {static_cast<double>(ctx->ctxId)})
          .asObject(runtime)
    : createWebGLObject(
          runtime, EXWebGLClass::WebGLRenderingContext, {static_cast<double>(ctx->ctxId)})
          .asObject(runtime);

  gl.setProperty(runtime, "drawingBufferWidth", viewport.viewportWidth);
  gl.setProperty(runtime, "drawingBufferHeight", viewport.viewportHeight);
  gl.setProperty(runtime, "supportsWebGL2", ctx->supportsWebGL2);
  gl.setProperty(runtime, "contextId", static_cast<double>(ctx->ctxId));

  jsi::Value jsContextMap = global.getProperty(runtime, EXGLContextsMapPropertyName);
  if (jsContextMap.isNull() || jsContextMap.isUndefined()) {
    global.setProperty(runtime, EXGLContextsMapPropertyName, jsi::Object(runtime));
  }
  global.getProperty(runtime, EXGLContextsMapPropertyName)
      .asObject(runtime)
      .setProperty(runtime, jsi::PropNameID::forUtf8(runtime, std::to_string(ctx->ctxId)), gl);
}

// We are assuming that eval was called before first object 
// is created and all global.WebGL... stub functions already exist
jsi::Value createWebGLObject(
    jsi::Runtime &runtime,
    EXWebGLClass webglClass,
    std::initializer_list<jsi::Value> &&args) {
  jsi::Object webglObject = runtime.global()
          .getProperty(runtime, jsi::PropNameID::forUtf8(runtime, getConstructorName(webglClass)))
          .asObject(runtime)
          .asFunction(runtime)
          .callAsConstructor(runtime, {})
          .asObject(runtime);
  jsi::Value id = args.size() > 0 ? jsi::Value(runtime, *args.begin()) : jsi::Value::undefined();
  webglObject.setProperty(runtime, "id", id);
  return webglObject;
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

void attachClass(
    jsi::Runtime &runtime,
    EXWebGLClass webglClass,
    std::function<void(EXWebGLClass webglClass)> installPrototypes) {
  jsi::PropNameID name = jsi::PropNameID::forUtf8(runtime, getConstructorName(webglClass));
  installPrototypes(webglClass);
}

// https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/Inheritance#setting_teachers_prototype_and_constructor_reference
//
// Below implementation is equivalent of `class WebGLBuffer extends WebGLObject {}`
// where baseClass=global.WebGLObject and derivedProp="WebGLBuffer"
//
// WebGLBuffer.prototype = Object.create(WebGLObject.prototype);
// Object.defineProperty(WebGLBuffer.prototype, 'constructor', {
//   value: WebGLBuffer,
//   enumerable: false,
//   configurable: true,
//   writable: true });
void jsClassExtend(jsi::Runtime &runtime, jsi::Object &baseClass, jsi::PropNameID derivedProp) {
  jsi::PropNameID prototype = jsi::PropNameID::forUtf8(runtime, "prototype");
  jsi::Object objectClass = runtime.global().getPropertyAsObject(runtime, "Object");
  jsi::Function createMethod = objectClass.getPropertyAsFunction(runtime, "create");
  jsi::Function definePropertyMethod = objectClass.getPropertyAsFunction(runtime, "defineProperty");
  jsi::Object derivedClass = runtime.global().getProperty(runtime, derivedProp).asObject(runtime);

  // WebGLBuffer.prototype = Object.create(WebGLObject.prototype);
  derivedClass.setProperty(
      runtime,
      prototype,
      createMethod.callWithThis(runtime, objectClass, {baseClass.getProperty(runtime, prototype)}));

  jsi::Object propertyOptions(runtime);
  propertyOptions.setProperty(runtime, "value", derivedClass);
  propertyOptions.setProperty(runtime, "enumerable", false);
  propertyOptions.setProperty(runtime, "configurable", true);
  propertyOptions.setProperty(runtime, "writable", true);

  // Object.defineProperty ...
  definePropertyMethod.callWithThis(
      runtime,
      objectClass,
      {
          derivedClass.getProperty(runtime, prototype),
          jsi::String::createFromUtf8(runtime, "constructor"),
          std::move(propertyOptions),
      });
}

void ensurePrototypes(jsi::Runtime &runtime) {
  if (runtime.global().hasProperty(runtime, "WebGLRenderingContext")) {
    return;
  }
  runtime.global().setProperty(runtime, "__EXGLConstructorReady", true);
  
  auto evalBuffer = std::make_shared<jsi::StringBuffer>(evalStubConstructors);
  runtime.evaluateJavaScript(evalBuffer, "expo-gl");

  auto inheritFromJsObject = [&runtime](EXWebGLClass classEnum) {
    auto objectClass = runtime.global().getPropertyAsObject(runtime, "Object");
    jsClassExtend(
        runtime, objectClass, jsi::PropNameID::forUtf8(runtime, getConstructorName(classEnum)));
  };

  // configure WebGLRenderingContext
  {
    inheritFromJsObject(EXWebGLClass::WebGLRenderingContext);
    auto prototype =
        runtime.global()
            .getProperty(runtime, jsi::PropNameID::forUtf8(runtime, getConstructorName(EXWebGLClass::WebGLRenderingContext)))
            .asObject(runtime)
            .getPropertyAsObject(runtime, "prototype");
    installConstants(runtime, prototype);
    installWebGLMethods(runtime, prototype);
  }

  // configure WebGL2RenderingContext
  {
    inheritFromJsObject(EXWebGLClass::WebGL2RenderingContext);
    auto prototype =
        runtime.global()
            .getProperty(runtime, jsi::PropNameID::forUtf8(runtime, getConstructorName(EXWebGLClass::WebGL2RenderingContext)))
            .asObject(runtime)
            .getPropertyAsObject(runtime, "prototype");
    installConstants(runtime, prototype);
    installWebGL2Methods(runtime, prototype);
  }

  // Configure rest of WebGL objects
  inheritFromJsObject(EXWebGLClass::WebGLObject);

  jsi::Object webglObjectClass =
      runtime.global()
          .getProperty(
              runtime,
              jsi::PropNameID::forUtf8(runtime, getConstructorName(EXWebGLClass::WebGLObject)))
          .asObject(runtime);
  auto inheritFromWebGLObject = [&runtime, &webglObjectClass](EXWebGLClass classEnum) {
    jsClassExtend(
        runtime,
        webglObjectClass,
        jsi::PropNameID::forUtf8(runtime, getConstructorName(classEnum)));
  };

  inheritFromWebGLObject(EXWebGLClass::WebGLBuffer);
  inheritFromWebGLObject(EXWebGLClass::WebGLFramebuffer);
  inheritFromWebGLObject(EXWebGLClass::WebGLProgram);
  inheritFromWebGLObject(EXWebGLClass::WebGLRenderbuffer);
  inheritFromWebGLObject(EXWebGLClass::WebGLShader);
  inheritFromWebGLObject(EXWebGLClass::WebGLTexture);
  inheritFromJsObject(EXWebGLClass::WebGLUniformLocation);
  inheritFromJsObject(EXWebGLClass::WebGLActiveInfo);
  inheritFromJsObject(EXWebGLClass::WebGLShaderPrecisionFormat);
  inheritFromWebGLObject(EXWebGLClass::WebGLQuery);
  inheritFromWebGLObject(EXWebGLClass::WebGLSampler);
  inheritFromWebGLObject(EXWebGLClass::WebGLSync);
  inheritFromWebGLObject(EXWebGLClass::WebGLTransformFeedback);
  inheritFromWebGLObject(EXWebGLClass::WebGLVertexArrayObject);
}

void installConstants(jsi::Runtime &runtime, jsi::Object &gl) {
#define GL_CONSTANT(name) gl.setProperty(runtime, #name, static_cast<double>(GL_##name));
#include "EXWebGLConstants.def"
#undef GL_CONSTANT
}

void installWebGLMethods(jsi::Runtime &runtime, jsi::Object &gl) {
#define NATIVE_METHOD(name) setFunctionOnObject(runtime, gl, #name, method::glNativeMethod_##name);

#define NATIVE_WEBGL2_METHOD(name) ;
#include "EXWebGLMethods.def"
#undef NATIVE_WEBGL2_METHOD
#undef NATIVE_METHOD
}

void installWebGL2Methods(jsi::Runtime &runtime, jsi::Object &gl) {
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
