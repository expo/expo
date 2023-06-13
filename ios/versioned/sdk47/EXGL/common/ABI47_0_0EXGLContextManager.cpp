#include "ABI47_0_0EXGLContextManager.h"

namespace ABI47_0_0expo {
namespace gl_cpp {

struct ContextState {
  ABI47_0_0EXGLContext *ctx;
  std::shared_mutex mutex;
};

struct ContextManager {
  std::unordered_map<ABI47_0_0EXGLContextId, ContextState> contextMap;
  std::mutex contextLookupMutex;
  ABI47_0_0EXGLContextId nextId = 1;
};

ContextManager manager;

ContextWithLock ContextGet(ABI47_0_0EXGLContextId id) {
  std::lock_guard lock(manager.contextLookupMutex);
  auto iter = manager.contextMap.find(id);
  // if ctx is null then destroy is in progress
  if (iter == manager.contextMap.end() || iter->second.ctx == nullptr) {
    return {nullptr, std::shared_lock<std::shared_mutex>()};
  }
  return {iter->second.ctx, std::shared_lock(iter->second.mutex)};
}

ABI47_0_0EXGLContextId ContextCreate() {
  // Out of ids?
  if (manager.nextId >= std::numeric_limits<ABI47_0_0EXGLContextId>::max()) {
    ABI47_0_0EXGLSysLog("Ran out of ABI47_0_0EXGLContext ids!");
    return 0;
  }

  std::lock_guard<std::mutex> lock(manager.contextLookupMutex);
  ABI47_0_0EXGLContextId ctxId = manager.nextId++;
  if (manager.contextMap.find(ctxId) != manager.contextMap.end()) {
    ABI47_0_0EXGLSysLog("Tried to reuse an ABI47_0_0EXGLContext id. This shouldn't really happen...");
    return 0;
  }
  manager.contextMap[ctxId].ctx = new ABI47_0_0EXGLContext(ctxId);
  return ctxId;
}

void ContextDestroy(ABI47_0_0EXGLContextId id) {
  std::lock_guard lock(manager.contextLookupMutex);

  auto iter = manager.contextMap.find(id);
  if (iter != manager.contextMap.end()) {
    {
      std::unique_lock lock(iter->second.mutex);
      delete iter->second.ctx;
    }
    manager.contextMap.erase(iter);
  }
}

} // namespace gl_cpp
} // namespace ABI47_0_0expo
