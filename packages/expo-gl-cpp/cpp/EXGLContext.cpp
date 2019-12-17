#include "EXGLContext.h"

#include <JavaScriptCore/JSContextRef.h>

#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

static std::unordered_map<UEXGLContextId, EXGLContext *> EXGLContextMap;
static std::mutex EXGLContextMapMutex;
static UEXGLContextId EXGLContextNextId = 1;

std::atomic_uint EXGLContext::nextObjectId { 1 };

EXGLContext *EXGLContext::ContextGet(UEXGLContextId exglCtxId) {
  std::lock_guard<decltype(EXGLContextMapMutex)> lock(EXGLContextMapMutex);
  auto iter = EXGLContextMap.find(exglCtxId);
  if (iter != EXGLContextMap.end()) {
    return iter->second;
  }
  return nullptr;
}

UEXGLContextId EXGLContext::ContextCreate(JSGlobalContextRef jsCtx) {
  // Out of ids?
  if (EXGLContextNextId >= std::numeric_limits<UEXGLContextId>::max()) {
    EXGLSysLog("Ran out of EXGLContext ids!");
    return 0;
  }

  // Create C++ object
  EXGLContext *exglCtx;
  UEXGLContextId exglCtxId;
  {
    std::lock_guard<decltype(EXGLContextMapMutex)> lock(EXGLContextMapMutex);
    exglCtxId = EXGLContextNextId++;
    if (EXGLContextMap.find(exglCtxId) != EXGLContextMap.end()) {
      EXGLSysLog("Tried to reuse an EXGLContext id. This shouldn't really happen...");
      return 0;
    }
    exglCtx = new EXGLContext(jsCtx, exglCtxId);
    EXGLContextMap[exglCtxId] = exglCtx;
  }

  // Save JavaScript object
  auto jsGlobal = JSContextGetGlobalObject(jsCtx);
  auto jsEXGLContextMap = (JSObjectRef) EXJSObjectGetPropertyNamed(jsCtx, jsGlobal, "__EXGLContexts");
  if (!JSValueToBoolean(jsCtx, jsEXGLContextMap)) {
    jsEXGLContextMap = JSObjectMake(jsCtx, nullptr, nullptr);
    EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsGlobal, "__EXGLContexts", jsEXGLContextMap);
  }
  std::stringstream ss;
  ss << exglCtxId;
  auto exglCtxIdStr = ss.str();
  EXJSObjectSetValueWithUTF8CStringName(jsCtx, jsEXGLContextMap,
                                        exglCtxIdStr.c_str(), exglCtx->getJSObject());

  return exglCtxId;
}

void EXGLContext::ContextDestroy(UEXGLContextId exglCtxId) {
  std::lock_guard<decltype(EXGLContextMapMutex)> lock(EXGLContextMapMutex);

  // Destroy C++ object, JavaScript side should just know...
  auto iter = EXGLContextMap.find(exglCtxId);
  if (iter != EXGLContextMap.end()) {
    delete iter->second;
    EXGLContextMap.erase(iter);
  }
}

// Load image data from an object with a `.localUri` member
std::shared_ptr<void> EXGLContext::loadImage(
        JSContextRef jsCtx,
        JSObjectRef jsPixels,
        int *fileWidth,
        int *fileHeight,
        int *fileComp) {
  JSValueRef jsLocalUri = EXJSObjectGetPropertyNamed(jsCtx, jsPixels, "localUri");
  if (jsLocalUri && JSValueIsString(jsCtx, jsLocalUri)) {
    // TODO(nikki): Check that this file is in the right scope
    auto localUri = jsValueToSharedStr(jsCtx, jsLocalUri);
    if (strncmp(localUri.get(), "file://", 7) != 0) {
      return std::shared_ptr<void>(nullptr);
    }
    char localPath[strlen(localUri.get())];
    decodeURI(localPath, localUri.get() + 7);
    return std::shared_ptr<void>(stbi_load(localPath,
                                           fileWidth, fileHeight, fileComp,
                                           STBI_rgb_alpha),
                                 stbi_image_free);
  }
  return std::shared_ptr<void>(nullptr);
}
