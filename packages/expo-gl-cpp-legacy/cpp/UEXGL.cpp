#include "UEXGL.h"

#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSObjectRef.h>
#include <JavaScriptCore/JSValueRef.h>

#include "EXGLContext.h"

UEXGLContextId UEXGLContextCreate(JSGlobalContextRef jsCtx) {
  return EXGLContext::ContextCreate(jsCtx);
}

void UEXGLContextSetFlushMethod(UEXGLContextId exglCtxId, std::function<void(void)> flushMethod) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->flushOnGLThread = flushMethod;
  }
}

#ifdef __APPLE__
void UEXGLContextSetFlushMethodObjc(UEXGLContextId exglCtxId, UEXGLFlushMethodBlock flushMethod) {
  UEXGLContextSetFlushMethod(exglCtxId, [flushMethod] {
    flushMethod();
  });
}
#endif

bool UEXGLContextNeedsRedraw(UEXGLContextId exglCtxId) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->needsRedraw;
  }
  return false;
}

void UEXGLContextDrawEnded(UEXGLContextId exglCtxId) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->setNeedsRedraw(false);
  }
}

void UEXGLContextDestroy(UEXGLContextId exglCtxId) {
  EXGLContext::ContextDestroy(exglCtxId);
}

void UEXGLContextFlush(UEXGLContextId exglCtxId) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->flush();
  }
}

void UEXGLContextSetDefaultFramebuffer(UEXGLContextId exglCtxId, GLint framebuffer) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->setDefaultFramebuffer(framebuffer);
  }
}


UEXGLObjectId UEXGLContextCreateObject(UEXGLContextId exglCtxId) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->createObject();
  }
  return 0;
}

void UEXGLContextDestroyObject(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->destroyObject(exglObjId);
  }
}

void UEXGLContextMapObject(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId, GLuint glObj) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    exglCtx->mapObject(exglObjId, glObj);
  }
}

GLuint UEXGLContextGetObject(UEXGLContextId exglCtxId, UEXGLObjectId exglObjId) {
  auto exglCtx = EXGLContext::ContextGet(exglCtxId);
  if (exglCtx) {
    return exglCtx->lookupObject(exglObjId);
  }
  return 0;
}
