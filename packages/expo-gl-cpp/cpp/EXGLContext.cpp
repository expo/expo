#include "EXGLContext.h"

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

UEXGLContextId EXGLContext::ContextCreate(jsi::Runtime& runtime) {
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
    exglCtx = new EXGLContext(runtime, exglCtxId);
    EXGLContextMap[exglCtxId] = exglCtx;
  }

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

void decodeURI(char *dst, const char *src) {
  char a, b;
  while (*src) {
    if ((*src == '%') &&
        ((a = src[1]) && (b = src[2])) &&
        (isxdigit(a) && isxdigit(b))) {
      if (a >= 'a') {
        a -= 'a' - 'A';
      }
      if (a >= 'A') {
        a -= ('A' - 10);
      } else {
        a -= '0';
      }
      if (b >= 'a') {
        b -= 'a' - 'A';
      }
      if (b >= 'A') {
        b -= ('A' - 10);
      } else {
        b -= '0';
      }
      *dst++ = 16 * a + b;
      src += 3;
    } else if (*src == '+') {
      *dst++ = ' ';
      src++;
    } else {
      *dst++ = *src++;
    }
  }
  *dst++ = '\0';
}

// TODO(wkozyra95) needs to be moved (for now it's here because it requires access to EXGLContext and needs to be in cpp file
// Load image data from an object with a `.localUri` member
std::shared_ptr<uint8_t> EXGLContext::loadImage(
        jsi::Runtime& runtime,
        const jsi::Value& jsPixels,
        int *fileWidth,
        int *fileHeight,
        int *fileComp) {
  auto localUriProp = jsPixels.asObject(runtime).getProperty(runtime, "localUri");
  if (localUriProp.isString()) {
    auto localUri = localUriProp.asString(runtime).utf8(runtime);
    if (strncmp(localUri.c_str(), "file://", 7) != 0) {
      return std::shared_ptr<uint8_t>(nullptr);
    }
    char localPath[localUri.size()];
    decodeURI(localPath, localUri.c_str() + 7);

    return std::shared_ptr<uint8_t>(
            stbi_load(
                localPath,
                fileWidth,
                fileHeight,
                fileComp,
                STBI_rgb_alpha),
            [](void* data) {
                stbi_image_free(data);;
            });
  }
  return std::shared_ptr<uint8_t>(nullptr);
}
