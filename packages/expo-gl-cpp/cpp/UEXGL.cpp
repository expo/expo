#include "UEXGL.h"
#include "EXGLContext.h"
#include "EXGLContextManager.h"

using namespace expo::gl_cpp;

UEXGLContextId UEXGLContextCreate() {
  return EXGLContextCreate();
}

#ifdef __APPLE__
void UEXGLContextPrepare(void *jsiPtr, UEXGLContextId exglCtxId, UEXGLFlushMethodBlock flushMethod) {
  auto [exglCtx, lock] = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->prepareContext(*reinterpret_cast<jsi::Runtime *>(jsiPtr), [flushMethod] { flushMethod(); });
  }
}
#else
void UEXGLContextPrepare(void *jsiPtr, UEXGLContextId exglCtxId, std::function<void(void)> flushMethod) {
  auto [exglCtx, lock] = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->prepareContext(*reinterpret_cast<jsi::Runtime *>(jsiPtr), flushMethod);
  }
}
#endif

bool UEXGLContextNeedsRedraw(UEXGLContextId exglCtxId) {
  auto [exglCtx, lock] = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->needsRedraw;
  }
  return false;
}

void UEXGLContextDrawEnded(UEXGLContextId exglCtxId) {
  auto [exglCtx, lock] = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->needsRedraw = false;
  }
}

void UEXGLContextDestroy(UEXGLContextId exglCtxId) {
  EXGLContextDestroy(exglCtxId);
}

void UEXGLContextFlush(UEXGLContextId exglCtxId) {
  auto [exglCtx, lock] = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->flush();
  }
}

void UEXGLContextSetDefaultFramebuffer(UEXGLContextId exglCtxId, GLint framebuffer) {
  auto [exglCtx, lock] = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->defaultFramebuffer = framebuffer;
  }
}

UEXGLObjectId UEXGLContextCreateObject(UEXGLContextId exglCtxId) {
  auto [exglCtx, lock] = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->createObject();
  }
  return 0;
}

void UEXGLContextDestroyObject(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId) {
  auto [exglCtx, lock] = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->destroyObject(exglObjId);
  }
}

void UEXGLContextMapObject(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId, GLuint glObj) {
  auto [exglCtx, lock] = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->mapObject(exglObjId, glObj);
  }
}

GLuint UEXGLContextGetObject(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId) {
  auto [exglCtx, lock] = EXGLContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->lookupObject(exglObjId);
  }
  return 0;
}
