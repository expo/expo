#include "EXGLContext.h"

static std::unordered_map<UEXGLContextId, EXGLContext *> EXGLContextMap;
static std::mutex EXGLContextMapMutex;
static UEXGLContextId EXGLContextNextId = 1;

std::atomic_uint EXGLContext::nextObjectId{1};

EXGLContext *EXGLContext::ContextGet(UEXGLContextId exglCtxId) {
  std::lock_guard<decltype(EXGLContextMapMutex)> lock(EXGLContextMapMutex);
  auto iter = EXGLContextMap.find(exglCtxId);
  if (iter != EXGLContextMap.end()) {
    return iter->second;
  }
  return nullptr;
}

UEXGLContextId EXGLContext::ContextCreate(jsi::Runtime &runtime) {
  // Out of ids?
  if (EXGLContextNextId >= std::numeric_limits<UEXGLContextId>::max()) {
    EXGLSysLog("Ran out of EXGLContext ids!");
    return 0;
  }

  // Create C++ object
  EXGLContext *exglCtx;
  UEXGLContextId exglCtxId;
  {
    std::lock_guard<std::mutex> lock(EXGLContextMapMutex);
    exglCtxId = EXGLContextNextId++;
    if (EXGLContextMap.find(exglCtxId) != EXGLContextMap.end()) {
      EXGLSysLog("Tried to reuse an EXGLContext id. This shouldn't really happen...");
      return 0;
    }
    exglCtx = new EXGLContext(runtime, exglCtxId);
    EXGLContextMap[exglCtxId] = exglCtx;
  }

  return exglCtxId;
}

void EXGLContext::ContextDestroy(UEXGLContextId exglCtxId) {
  std::lock_guard<std::mutex> lock(EXGLContextMapMutex);

  // Destroy C++ object, JavaScript side should just know...
  auto iter = EXGLContextMap.find(exglCtxId);
  if (iter != EXGLContextMap.end()) {
    delete iter->second;
    EXGLContextMap.erase(iter);
  }
}

void EXGLContext::installMethods(
    jsi::Runtime &runtime,
    jsi::Object &jsGl,
    UEXGLContextId exglCtxId) {
  using namespace std::placeholders;
#define INSTALL_METHOD(name, requiredWebgl2)                                       \
  setFunctionOnObject(                                                             \
      runtime,                                                                     \
      jsGl,                                                                        \
      #name,                                                                       \
      [this, exglCtxId](                                                           \
          jsi::Runtime &runtime,                                                   \
          const jsi::Value &jsThis,                                                \
          const jsi::Value *jsArgv,                                                \
          size_t argc) {                                                           \
        auto exglCtx = EXGLContext::ContextGet(exglCtxId);                         \
        if (!exglCtx) {                                                            \
          return jsi::Value::null();                                               \
        }                                                                          \
        try {                                                                      \
          if (requiredWebgl2 && !this->supportsWebGL2) {                           \
            unsupportedWebGL2(#name, runtime, jsThis, jsArgv, argc);               \
            return jsi::Value::null();                                             \
          } else {                                                                 \
            return this->glNativeMethod_##name(runtime, jsThis, jsArgv, argc);     \
          }                                                                        \
        } catch (const std::exception &e) {                                        \
          throw std::runtime_error(std::string("[" #name "] error: ") + e.what()); \
        }                                                                          \
      });

#define NATIVE_METHOD(name) INSTALL_METHOD(name, false)
#define NATIVE_WEBGL2_METHOD(name) INSTALL_METHOD(name, true)
#include "EXGLNativeMethods.def"
#undef NATIVE_METHOD
#undef NATIVE_WEBGL2_METHOD
}

void EXGLContext::installConstants(jsi::Runtime &runtime, jsi::Object &jsGl) {
#define GL_CONSTANT(name) \
  jsGl.setProperty(       \
      runtime, jsi::PropNameID::forUtf8(runtime, #name), static_cast<double>(GL_##name));
#include "EXGLConstants.def"
#undef GL_CONSTANT
};

jsi::Value EXGLContext::exglIsObject(UEXGLObjectId id, std::function<GLboolean(GLuint)> func) {
  GLboolean glResult;
  addBlockingToNextBatch([&] { glResult = func(lookupObject(id)); });
  return glResult == GL_TRUE;
}

jsi::Value EXGLContext::exglGenObject(
    jsi::Runtime &runtime,
    std::function<void(GLsizei, UEXGLObjectId *)> func) {
  return addFutureToNextBatch(runtime, [=] {
    GLuint buffer;
    func(1, &buffer);
    return buffer;
  });
  return nullptr;
}

jsi::Value EXGLContext::exglCreateObject(jsi::Runtime &runtime, std::function<GLuint()> func) {
  return addFutureToNextBatch(runtime, [=] { return func(); });
  return nullptr;
}

jsi::Value EXGLContext::exglDeleteObject(
    UEXGLObjectId id,
    std::function<void(UEXGLObjectId)> func) {
  addToNextBatch([=] { func(lookupObject(id)); });
  return nullptr;
}

jsi::Value EXGLContext::exglDeleteObject(
    UEXGLObjectId id,
    std::function<void(GLsizei, const UEXGLObjectId *)> func) {
  addToNextBatch([=] {
    GLuint buffer = lookupObject(id);
    func(1, &buffer);
  });
  return nullptr;
}
jsi::Value EXGLContext::exglUnimplemented(std::string name) {
  throw std::runtime_error("EXGL: " + name + "() isn't implemented yet!");
}
