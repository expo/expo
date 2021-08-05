#include "EXGLContextManager.h"

namespace expo {
namespace gl_cpp {

struct ContextState {
  EXGLContext *ctx;
  std::mutex mutex;
};

class ContextManager {
 public:
  EXGLContextWithLock getContext(UEXGLContextId exglCtxId);
  UEXGLContextId createContext(jsi::Runtime &runtime);
  void destroyContext(UEXGLContextId exglCtxId);

 private:
  std::unordered_map<UEXGLContextId, ContextState> contextMap;
  std::mutex contextLookupMutex;
  UEXGLContextId EXGLContextNextId = 1;
};

EXGLContextWithLock ContextManager::getContext(UEXGLContextId id) {
  std::lock_guard lock(contextLookupMutex);
  auto iter = contextMap.find(id);
  // if ctx is null then destroy is in progress
  if (iter == contextMap.end() || iter->second.ctx == nullptr) {
    return {nullptr, std::unique_lock<std::mutex>()};
  }
  return {iter->second.ctx, std::unique_lock(iter->second.mutex)};
}

UEXGLContextId ContextManager::createContext(jsi::Runtime &runtime) {
  // Out of ids?
  if (EXGLContextNextId >= std::numeric_limits<UEXGLContextId>::max()) {
    EXGLSysLog("Ran out of EXGLContext ids!");
    return 0;
  }

  std::lock_guard<std::mutex> lock(contextLookupMutex);
  UEXGLContextId ctxId = EXGLContextNextId++;
  if (contextMap.find(ctxId) != contextMap.end()) {
    EXGLSysLog("Tried to reuse an EXGLContext id. This shouldn't really happen...");
    return 0;
  }
  contextMap[ctxId].ctx = new EXGLContext(runtime, ctxId);
  return ctxId;
}

void ContextManager::destroyContext(UEXGLContextId id) {
  std::lock_guard lock(contextLookupMutex);

  auto iter = contextMap.find(id);
  if (iter != contextMap.end()) {
    {
      std::lock_guard lock(iter->second.mutex);
      delete iter->second.ctx;
    }
    contextMap.erase(iter);
  }
}

ContextManager manager;
UEXGLContextId EXGLContextCreate(jsi::Runtime &runtime) {
  return manager.createContext(runtime);
}
EXGLContextWithLock EXGLContextGet(UEXGLContextId id) {
  return manager.getContext(id);
}
void EXGLContextDestroy(UEXGLContextId id) {
  return manager.destroyContext(id);
}

} // namespace gl_cpp
} // namespace expo
