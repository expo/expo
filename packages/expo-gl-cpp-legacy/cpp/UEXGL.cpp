#include "UEXGL.h"

#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSValueRef.h>

#include "EXGLContext.h"

UEXGLContextId UEXGLContextCreate__Legacy(JSGlobalContextRef jsCtx) {
  return EXGLContext::ContextCreate(jsCtx);
}

void UEXGLContextSetFlushMethod__Legacy(UEXGLContextId exglCtxId, std::function<void(void)> flushMethod) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->flushOnGLThread = flushMethod;
  }
}

#ifdef __APPLE__
void UEXGLContextSetFlushMethodObjc__Legacy(UEXGLContextId exglCtxId, UEXGLFlushMethodBlock flushMethod) {
  UEXGLContextSetFlushMethod__Legacy(exglCtxId, [flushMethod] {
    flushMethod();
  });
}
#endif

bool UEXGLContextNeedsRedraw__Legacy(UEXGLContextId exglCtxId) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->needsRedraw;
  }
  return false;
}

void UEXGLContextDrawEnded__Legacy(UEXGLContextId exglCtxId) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->setNeedsRedraw(false);
  }
}

void UEXGLContextDestroy__Legacy(UEXGLContextId exglCtxId) {
  EXGLContext::ContextDestroy(exglCtxId);
}

void UEXGLContextFlush__Legacy(UEXGLContextId exglCtxId) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->flush();
  }
}

void UEXGLContextSetDefaultFramebuffer__Legacy(UEXGLContextId exglCtxId, GLint framebuffer) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->setDefaultFramebuffer(framebuffer);
  }
}


UEXGLObjectId UEXGLContextCreateObject__Legacy(UEXGLContextId exglCtxId) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->createObject();
  }
  return 0;
}

void UEXGLContextDestroyObject__Legacy(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->destroyObject(exglObjId);
  }
}

void UEXGLContextMapObject__Legacy(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId, GLuint glObj) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->mapObject(exglObjId, glObj);
  }
}

GLuint UEXGLContextGetObject__Legacy(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->lookupObject(exglObjId);
  }
  return 0;
}
