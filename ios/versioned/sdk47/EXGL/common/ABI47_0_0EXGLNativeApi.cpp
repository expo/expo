#include "ABI47_0_0EXGLNativeApi.h"
#include "ABI47_0_0EXGLNativeContext.h"
#include "ABI47_0_0EXGLContextManager.h"

using namespace ABI47_0_0expo::gl_cpp;

ABI47_0_0EXGLContextId ABI47_0_0EXGLContextCreate() {
  return ContextCreate();
}

void ABI47_0_0EXGLContextPrepare(void *jsiPtr, ABI47_0_0EXGLContextId exglCtxId, std::function<void(void)> flushMethod) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->prepareContext(*reinterpret_cast<jsi::Runtime *>(jsiPtr), flushMethod);
  }
}

bool ABI47_0_0EXGLContextNeedsRedraw(ABI47_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->needsRedraw;
  }
  return false;
}

void ABI47_0_0EXGLContextDrawEnded(ABI47_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->needsRedraw = false;
  }
}

void ABI47_0_0EXGLContextDestroy(ABI47_0_0EXGLContextId exglCtxId) {
  ContextDestroy(exglCtxId);
}

void ABI47_0_0EXGLContextFlush(ABI47_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->flush();
  }
}

void ABI47_0_0EXGLContextSetDefaultFramebuffer(ABI47_0_0EXGLContextId exglCtxId, GLint framebuffer) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->defaultFramebuffer = framebuffer;
  }
}

ABI47_0_0EXGLObjectId ABI47_0_0EXGLContextCreateObject(ABI47_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->createObject();
  }
  return 0;
}

void ABI47_0_0EXGLContextDestroyObject(ABI47_0_0EXGLContextId exglCtxId, ABI47_0_0EXGLObjectId exglObjId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->destroyObject(exglObjId);
  }
}

void ABI47_0_0EXGLContextMapObject(ABI47_0_0EXGLContextId exglCtxId, ABI47_0_0EXGLObjectId exglObjId, GLuint glObj) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->mapObject(exglObjId, glObj);
  }
}

GLuint ABI47_0_0EXGLContextGetObject(ABI47_0_0EXGLContextId exglCtxId, ABI47_0_0EXGLObjectId exglObjId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->lookupObject(exglObjId);
  }
  return 0;
}
