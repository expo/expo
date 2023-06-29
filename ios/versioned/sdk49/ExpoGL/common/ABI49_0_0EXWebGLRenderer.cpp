#include "ABI49_0_0EXWebGLRenderer.h"
#include "ABI49_0_0EXGLNativeContext.h"
#include "ABI49_0_0EXGLContextManager.h"
#include "ABI49_0_0EXJsiUtils.h"
#include "ABI49_0_0EXWebGLMethods.h"
#include <ABI49_0_0jsi/ABI49_0_0jsi.h>

namespace ABI49_0_0expo {
namespace gl_cpp {

constexpr const char *ABI49_0_0EXGLContextsMapPropertyName = "__EXGLContexts";

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

void createWebGLRenderer(jsi::Runtime &runtime, ABI49_0_0EXGLContext *ctx, glesContext viewport, jsi::Object&& global) {
  ensurePrototypes(runtime);
  jsi::Object gl = ctx->supportsWebGL2
    ? createWebGLObject(
          runtime, ABI49_0_0EXWebGLClass::WebGL2RenderingContext, {static_cast<double>(ctx->ctxId)})
          .asObject(runtime)
    : createWebGLObject(
          runtime, ABI49_0_0EXWebGLClass::WebGLRenderingContext, {static_cast<double>(ctx->ctxId)})
          .asObject(runtime);

  gl.setProperty(runtime, "drawingBufferWidth", viewport.viewportWidth);
  gl.setProperty(runtime, "drawingBufferHeight", viewport.viewportHeight);
  gl.setProperty(runtime, "supportsWebGL2", ctx->supportsWebGL2);
  gl.setProperty(runtime, "contextId", static_cast<double>(ctx->ctxId));

  jsi::Value jsContextMap = global.getProperty(runtime, ABI49_0_0EXGLContextsMapPropertyName);
  if (jsContextMap.isNull() || jsContextMap.isUndefined()) {
    global.setProperty(runtime, ABI49_0_0EXGLContextsMapPropertyName, jsi::Object(runtime));
  }
  global.getProperty(runtime, ABI49_0_0EXGLContextsMapPropertyName)
      .asObject(runtime)
      .setProperty(runtime, jsi::PropNameID::forUtf8(runtime, std::to_string(ctx->ctxId)), gl);
}

// We are assuming that eval was called before first object 
// is created and all global.WebGL... stub functions already exist
jsi::Value createWebGLObject(
    jsi::Runtime &runtime,
    ABI49_0_0EXWebGLClass webglClass,
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

std::string getConstructorName(ABI49_0_0EXWebGLClass value) {
  switch (value) {
    case ABI49_0_0EXWebGLClass::WebGLRenderingContext:
      return "WebGLRenderingContext";
    case ABI49_0_0EXWebGLClass::WebGL2RenderingContext:
      return "WebGL2RenderingContext";
    case ABI49_0_0EXWebGLClass::WebGLObject:
      return "WebGLObject";
    case ABI49_0_0EXWebGLClass::WebGLBuffer:
      return "WebGLBuffer";
    case ABI49_0_0EXWebGLClass::WebGLFramebuffer:
      return "WebGLFramebuffer";
    case ABI49_0_0EXWebGLClass::WebGLProgram:
      return "WebGLProgram";
    case ABI49_0_0EXWebGLClass::WebGLRenderbuffer:
      return "WebGLRenderbuffer";
    case ABI49_0_0EXWebGLClass::WebGLShader:
      return "WebGLShader";
    case ABI49_0_0EXWebGLClass::WebGLTexture:
      return "WebGLTexture";
    case ABI49_0_0EXWebGLClass::WebGLUniformLocation:
      return "WebGLUniformLocation";
    case ABI49_0_0EXWebGLClass::WebGLActiveInfo:
      return "WebGLActiveInfo";
    case ABI49_0_0EXWebGLClass::WebGLShaderPrecisionFormat:
      return "WebGLShaderPrecisionFormat";
    case ABI49_0_0EXWebGLClass::WebGLQuery:
      return "WebGLQuery";
    case ABI49_0_0EXWebGLClass::WebGLSampler:
      return "WebGLSampler";
    case ABI49_0_0EXWebGLClass::WebGLSync:
      return "WebGLSync";
    case ABI49_0_0EXWebGLClass::WebGLTransformFeedback:
      return "WebGLTransformFeedback";
    case ABI49_0_0EXWebGLClass::WebGLVertexArrayObject:
      return "WebGLVertexArrayObject";
  }
}

void attachClass(
    jsi::Runtime &runtime,
    ABI49_0_0EXWebGLClass webglClass,
    std::function<void(ABI49_0_0EXWebGLClass webglClass)> installPrototypes) {
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

  auto inheritFromJsObject = [&runtime](ABI49_0_0EXWebGLClass classEnum) {
    auto objectClass = runtime.global().getPropertyAsObject(runtime, "Object");
    jsClassExtend(
        runtime, objectClass, jsi::PropNameID::forUtf8(runtime, getConstructorName(classEnum)));
  };

  // configure WebGLRenderingContext
  {
    inheritFromJsObject(ABI49_0_0EXWebGLClass::WebGLRenderingContext);
    auto prototype =
        runtime.global()
            .getProperty(runtime, jsi::PropNameID::forUtf8(runtime, getConstructorName(ABI49_0_0EXWebGLClass::WebGLRenderingContext)))
            .asObject(runtime)
            .getPropertyAsObject(runtime, "prototype");
    installConstants(runtime, prototype);
    installWebGLMethods(runtime, prototype);
  }

  // configure WebGL2RenderingContext
  {
    inheritFromJsObject(ABI49_0_0EXWebGLClass::WebGL2RenderingContext);
    auto prototype =
        runtime.global()
            .getProperty(runtime, jsi::PropNameID::forUtf8(runtime, getConstructorName(ABI49_0_0EXWebGLClass::WebGL2RenderingContext)))
            .asObject(runtime)
            .getPropertyAsObject(runtime, "prototype");
    installConstants(runtime, prototype);
    installWebGL2Methods(runtime, prototype);
  }

  // Configure rest of WebGL objects
  inheritFromJsObject(ABI49_0_0EXWebGLClass::WebGLObject);

  jsi::Object webglObjectClass =
      runtime.global()
          .getProperty(
              runtime,
              jsi::PropNameID::forUtf8(runtime, getConstructorName(ABI49_0_0EXWebGLClass::WebGLObject)))
          .asObject(runtime);
  auto inheritFromWebGLObject = [&runtime, &webglObjectClass](ABI49_0_0EXWebGLClass classEnum) {
    jsClassExtend(
        runtime,
        webglObjectClass,
        jsi::PropNameID::forUtf8(runtime, getConstructorName(classEnum)));
  };

  inheritFromWebGLObject(ABI49_0_0EXWebGLClass::WebGLBuffer);
  inheritFromWebGLObject(ABI49_0_0EXWebGLClass::WebGLFramebuffer);
  inheritFromWebGLObject(ABI49_0_0EXWebGLClass::WebGLProgram);
  inheritFromWebGLObject(ABI49_0_0EXWebGLClass::WebGLRenderbuffer);
  inheritFromWebGLObject(ABI49_0_0EXWebGLClass::WebGLShader);
  inheritFromWebGLObject(ABI49_0_0EXWebGLClass::WebGLTexture);
  inheritFromJsObject(ABI49_0_0EXWebGLClass::WebGLUniformLocation);
  inheritFromJsObject(ABI49_0_0EXWebGLClass::WebGLActiveInfo);
  inheritFromJsObject(ABI49_0_0EXWebGLClass::WebGLShaderPrecisionFormat);
  inheritFromWebGLObject(ABI49_0_0EXWebGLClass::WebGLQuery);
  inheritFromWebGLObject(ABI49_0_0EXWebGLClass::WebGLSampler);
  inheritFromWebGLObject(ABI49_0_0EXWebGLClass::WebGLSync);
  inheritFromWebGLObject(ABI49_0_0EXWebGLClass::WebGLTransformFeedback);
  inheritFromWebGLObject(ABI49_0_0EXWebGLClass::WebGLVertexArrayObject);
}

void installConstants(jsi::Runtime &runtime, jsi::Object &gl) {
#define GL_CONSTANT(name) gl.setProperty(runtime, #name, static_cast<double>(GL_##name));
#include "ABI49_0_0EXWebGLConstants.def"
#undef GL_CONSTANT
}

void installWebGLMethods(jsi::Runtime &runtime, jsi::Object &gl) {
#define NATIVE_METHOD(name) setFunctionOnObject(runtime, gl, #name, method::glNativeMethod_##name);

#define NATIVE_WEBGL2_METHOD(name) ;
#include "ABI49_0_0EXWebGLMethods.def"
#undef NATIVE_WEBGL2_METHOD
#undef NATIVE_METHOD
}

void installWebGL2Methods(jsi::Runtime &runtime, jsi::Object &gl) {
#define CREATE_METHOD(name) setFunctionOnObject(runtime, gl, #name, method::glNativeMethod_##name);

#define NATIVE_METHOD(name) CREATE_METHOD(name)
#define NATIVE_WEBGL2_METHOD(name) CREATE_METHOD(name)
#include "ABI49_0_0EXWebGLMethods.def"
#undef NATIVE_WEBGL2_METHOD
#undef NATIVE_METHOD
#undef CREATE_METHOD
}

} // namespace gl_cpp
} // namespace ABI49_0_0expo
