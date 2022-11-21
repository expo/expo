#include "ABI46_0_0EXGL.h"
#include "ABI46_0_0EXGLContext.h"
#include "ABI46_0_0EXGLContextManager.h"

using namespace ABI46_0_0expo::gl_cpp;

ABI46_0_0EXGLContextId ABI46_0_0EXGLContextCreate() {
  return ContextCreate();
}

#ifdef __APPLE__
void ABI46_0_0EXGLContextPrepare(void *jsiPtr, ABI46_0_0EXGLContextId exglCtxId, ABI46_0_0EXGLFlushMethodBlock flushMethod) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->prepareContext(*reinterpret_cast<jsi::Runtime *>(jsiPtr), [flushMethod] { flushMethod(); });
  }
}
#else
void ABI46_0_0EXGLContextPrepare(void *jsiPtr, ABI46_0_0EXGLContextId exglCtxId, std::function<void(void)> flushMethod) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->prepareContext(*reinterpret_cast<jsi::Runtime *>(jsiPtr), flushMethod);
  }
}
#endif

bool ABI46_0_0EXGLContextNeedsRedraw(ABI46_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->needsRedraw;
  }
  return false;
}

void ABI46_0_0EXGLContextDrawEnded(ABI46_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->needsRedraw = false;
  }
}

void ABI46_0_0EXGLContextDestroy(ABI46_0_0EXGLContextId exglCtxId) {
  ContextDestroy(exglCtxId);
}

void ABI46_0_0EXGLContextFlush(ABI46_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->flush();
  }
}

void ABI46_0_0EXGLContextSetDefaultFramebuffer(ABI46_0_0EXGLContextId exglCtxId, GLint framebuffer) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->defaultFramebuffer = framebuffer;
  }
}

ABI46_0_0EXGLObjectId ABI46_0_0EXGLContextCreateObject(ABI46_0_0EXGLContextId exglCtxId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->createObject();
  }
  return 0;
}

void ABI46_0_0EXGLContextDestroyObject(ABI46_0_0EXGLContextId exglCtxId, ABI46_0_0EXGLObjectId exglObjId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->destroyObject(exglObjId);
  }
}

void ABI46_0_0EXGLContextMapObject(ABI46_0_0EXGLContextId exglCtxId, ABI46_0_0EXGLObjectId exglObjId, GLuint glObj) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->mapObject(exglObjId, glObj);
  }
}

GLuint ABI46_0_0EXGLContextGetObject(ABI46_0_0EXGLContextId exglCtxId, ABI46_0_0EXGLObjectId exglObjId) {
  auto [exglCtx, lock] = ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->lookupObject(exglObjId);
  }
  return 0;
}
