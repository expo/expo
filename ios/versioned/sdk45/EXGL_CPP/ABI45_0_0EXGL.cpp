#include "ABI45_0_0EXGL.h"
#include "ABI45_0_0EXGLContext.h"
#include "ABI45_0_0EXGLContextManager.h"

using namespace ABI45_0_0expo::gl_cpp;

ABI45_0_0EXGLContextId ABI45_0_0EXGLContextCreate() {
  return ContextCreate();
}

#ifdef __APPLE__
void ABI45_0_0EXGLContextPrepare(void *jsiPtr, ABI45_0_0EXGLContextId exglCtxId, ABI45_0_0EXGLFlushMethodBlock flushMethod) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->prepareContext(*reinterpret_cast<jsi::Runtime *>(jsiPtr), [flushMethod] { flushMethod(); });
  }
}
#else
void ABI45_0_0EXGLContextPrepare(void *jsiPtr, ABI45_0_0EXGLContextId exglCtxId, std::function<void(void)> flushMethod) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->prepareContext(*reinterpret_cast<jsi::Runtime *>(jsiPtr), flushMethod);
  }
}
#endif

bool ABI45_0_0EXGLContextNeedsRedraw(ABI45_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->needsRedraw;
  }
  return false;
}

void ABI45_0_0EXGLContextDrawEnded(ABI45_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->needsRedraw = false;
  }
}

void ABI45_0_0EXGLContextDestroy(ABI45_0_0EXGLContextId exglCtxId) {
  ContextDestroy(exglCtxId);
}

void ABI45_0_0EXGLContextFlush(ABI45_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->flush();
  }
}

void ABI45_0_0EXGLContextSetDefaultFramebuffer(ABI45_0_0EXGLContextId exglCtxId, GLint framebuffer) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->defaultFramebuffer = framebuffer;
  }
}

ABI45_0_0EXGLObjectId ABI45_0_0EXGLContextCreateObject(ABI45_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->createObject();
  }
  return 0;
}

void ABI45_0_0EXGLContextDestroyObject(ABI45_0_0EXGLContextId exglCtxId, ABI45_0_0EXGLObjectId exglObjId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->destroyObject(exglObjId);
  }
}

void ABI45_0_0EXGLContextMapObject(ABI45_0_0EXGLContextId exglCtxId, ABI45_0_0EXGLObjectId exglObjId, GLuint glObj) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->mapObject(exglObjId, glObj);
  }
}

GLuint ABI45_0_0EXGLContextGetObject(ABI45_0_0EXGLContextId exglCtxId, ABI45_0_0EXGLObjectId exglObjId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->lookupObject(exglObjId);
  }
  return 0;
}
