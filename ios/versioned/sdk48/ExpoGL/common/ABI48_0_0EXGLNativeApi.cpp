#include "ABI48_0_0EXGLNativeApi.h"
#include "ABI48_0_0EXGLNativeContext.h"
#include "ABI48_0_0EXGLContextManager.h"

using namespace ABI48_0_0expo::gl_cpp;

ABI48_0_0EXGLContextId ABI48_0_0EXGLContextCreate() {
  return ContextCreate();
}

void ABI48_0_0EXGLContextPrepare(void *jsiPtr, ABI48_0_0EXGLContextId exglCtxId, std::function<void(void)> flushMethod) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->prepareContext(*reinterpret_cast<jsi::Runtime *>(jsiPtr), flushMethod);
  }
}

bool ABI48_0_0EXGLContextNeedsRedraw(ABI48_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->needsRedraw;
  }
  return false;
}

void ABI48_0_0EXGLContextDrawEnded(ABI48_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->needsRedraw = false;
  }
}

void ABI48_0_0EXGLContextDestroy(ABI48_0_0EXGLContextId exglCtxId) {
  ContextDestroy(exglCtxId);
}

void ABI48_0_0EXGLContextFlush(ABI48_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->flush();
  }
}

void ABI48_0_0EXGLContextSetDefaultFramebuffer(ABI48_0_0EXGLContextId exglCtxId, GLint framebuffer) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->defaultFramebuffer = framebuffer;
  }
}

ABI48_0_0EXGLObjectId ABI48_0_0EXGLContextCreateObject(ABI48_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->createObject();
  }
  return 0;
}

void ABI48_0_0EXGLContextDestroyObject(ABI48_0_0EXGLContextId exglCtxId, ABI48_0_0EXGLObjectId exglObjId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->destroyObject(exglObjId);
  }
}

void ABI48_0_0EXGLContextMapObject(ABI48_0_0EXGLContextId exglCtxId, ABI48_0_0EXGLObjectId exglObjId, GLuint glObj) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->mapObject(exglObjId, glObj);
  }
}

GLuint ABI48_0_0EXGLContextGetObject(ABI48_0_0EXGLContextId exglCtxId, ABI48_0_0EXGLObjectId exglObjId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->lookupObject(exglObjId);
  }
  return 0;
}
