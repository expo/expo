#include "ABI49_0_0EXGLNativeApi.h"
#include "ABI49_0_0EXGLContextManager.h"
#include "ABI49_0_0EXGLNativeContext.h"

using namespace ABI49_0_0expo::gl_cpp;

ABI49_0_0EXGLContextId ABI49_0_0EXGLContextCreate() {
  return ContextCreate();
}

void ABI49_0_0EXGLContextPrepare(
    void *jsiPtr,
    ABI49_0_0EXGLContextId exglCtxId,
    std::function<void(void)> flushMethod) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->prepareContext(*reinterpret_cast<jsi::Runtime *>(jsiPtr), flushMethod);
  }
}

void ABI49_0_0EXGLContextPrepareWorklet(ABI49_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->prepareWorkletContext();
  }
}

bool ABI49_0_0EXGLContextNeedsRedraw(ABI49_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->needsRedraw;
  }
  return false;
}

void ABI49_0_0EXGLContextDrawEnded(ABI49_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->needsRedraw = false;
  }
}

void ABI49_0_0EXGLContextDestroy(ABI49_0_0EXGLContextId exglCtxId) {
  ContextDestroy(exglCtxId);
}

void ABI49_0_0EXGLContextFlush(ABI49_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->flush();
  }
}

void ABI49_0_0EXGLContextSetDefaultFramebuffer(ABI49_0_0EXGLContextId exglCtxId, GLint framebuffer) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->defaultFramebuffer = framebuffer;
  }
}

ABI49_0_0EXGLObjectId ABI49_0_0EXGLContextCreateObject(ABI49_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->createObject();
  }
  return 0;
}

void ABI49_0_0EXGLContextDestroyObject(ABI49_0_0EXGLContextId exglCtxId, ABI49_0_0EXGLObjectId exglObjId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->destroyObject(exglObjId);
  }
}

void ABI49_0_0EXGLContextMapObject(ABI49_0_0EXGLContextId exglCtxId, ABI49_0_0EXGLObjectId exglObjId, GLuint glObj) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->mapObject(exglObjId, glObj);
  }
}

GLuint ABI49_0_0EXGLContextGetObject(ABI49_0_0EXGLContextId exglCtxId, ABI49_0_0EXGLObjectId exglObjId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->lookupObject(exglObjId);
  }
  return 0;
}
