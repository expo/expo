#include "EXGLNativeApi.h"
#include "EXGLNativeContext.h"
#include "EXGLContextManager.h"

using namespace expo::gl_cpp;

EXGLContextId EXGLContextCreate() {
  return ContextCreate();
}

void EXGLContextPrepare(void *jsiPtr, EXGLContextId exglCtxId, std::function<void(void)> flushMethod) {
  auto ctx = ContextGet(exglCtxId);
  if (ctx) {
    ctx->prepareContext(*reinterpret_cast<jsi::Runtime *>(jsiPtr), flushMethod);
  }
}

bool EXGLContextNeedsRedraw(EXGLContextId exglCtxId) {
  auto ctx = ContextGet(exglCtxId);
  if (ctx) {
    return ctx->needsRedraw;
  }
  return false;
}

void EXGLContextDrawEnded(EXGLContextId exglCtxId) {
  auto ctx = ContextGet(exglCtxId);
  if (ctx) {
    ctx->needsRedraw = false;
  }
}

void EXGLContextDestroy(EXGLContextId exglCtxId) {
  ContextDestroy(exglCtxId);
}

void EXGLContextFlush(EXGLContextId exglCtxId) {
  auto ctx = ContextGet(exglCtxId);
  if (ctx) {
    ctx->flush();
  }
}

void EXGLContextSetDefaultFramebuffer(EXGLContextId exglCtxId, GLint framebuffer) {
  auto ctx = ContextGet(exglCtxId);
  if (ctx) {
    ctx->defaultFramebuffer = framebuffer;
  }
}

EXGLObjectId EXGLContextCreateObject(EXGLContextId exglCtxId) {
  auto ctx = ContextGet(exglCtxId);
  if (ctx) {
    return ctx->createObject();
  }
  return 0;
}

void EXGLContextDestroyObject(EXGLContextId exglCtxId, EXGLObjectId exglObjId) {
  auto ctx = ContextGet(exglCtxId);
  if (ctx) {
    ctx->destroyObject(exglObjId);
  }
}

void EXGLContextMapObject(EXGLContextId exglCtxId, EXGLObjectId exglObjId, GLuint glObj) {
  auto ctx = ContextGet(exglCtxId);
  if (ctx) {
    ctx->mapObject(exglObjId, glObj);
  }
}

GLuint EXGLContextGetObject(EXGLContextId exglCtxId, EXGLObjectId exglObjId) {
  auto ctx = ContextGet(exglCtxId);
  if (ctx) {
    return ctx->lookupObject(exglObjId);
  }
  return 0;
}
