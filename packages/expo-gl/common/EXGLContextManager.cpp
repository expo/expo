#include "EXGLContextManager.h"

namespace expo {
namespace gl_cpp {

struct ContextState {
  EXGLContext *ctx;
  std::shared_mutex mutex;
  bool isReady;
  std::condition_variable cv;
};

struct ContextManager {
  std::unordered_map<EXGLContextId, ContextState> contextMap;
  std::shared_mutex contextLookupMutex;
  EXGLContextId nextId = 1;
};

ContextManager manager;

ContextWithLock ContextGet(EXGLContextId id) {
  std::unique_lock lock(manager.contextLookupMutex);
  auto iter = manager.contextMap.find(id);
  // if ctx is null then destroy is in progress
  if (iter == manager.contextMap.end() || iter->second.ctx == nullptr) {
    return {nullptr, std::shared_lock<std::shared_mutex>()};
  }
  return {iter->second.ctx, std::shared_lock(iter->second.mutex)};
}

void ContextMarkReady(EXGLContextId id) {
  std::shared_lock lock(manager.contextLookupMutex);
  auto iter = manager.contextMap.find(id);
  // if ctx is null then destroy is in progress
  if (iter == manager.contextMap.end() || iter->second.ctx == nullptr) {
    return;
  }
  std::shared_lock contextLock(iter->second.mutex);
  iter->second.isReady = true;
  iter->second.cv.notify_one();
}

EXGLContextId ContextCreate() {
  // Out of ids?
  if (manager.nextId >= std::numeric_limits<EXGLContextId>::max()) {
    EXGLSysLog("Ran out of EXGLContext ids!");
    return 0;
  }

  std::unique_lock lock(manager.contextLookupMutex);
  EXGLContextId ctxId = manager.nextId++;
  if (manager.contextMap.find(ctxId) != manager.contextMap.end()) {
    EXGLSysLog("Tried to reuse an EXGLContext id. This shouldn't really happen...");
    return 0;
  }
  manager.contextMap[ctxId].ctx = new EXGLContext(ctxId);
  return ctxId;
}

void ContextDestroy(EXGLContextId id) {
  // Wait for isReady to be set.
  {
    std::shared_lock lock(manager.contextLookupMutex);
    auto iter = manager.contextMap.find(id);
    if (iter == manager.contextMap.end()) {
      EXGLSysLog("Unable to destory context. Context not found.");
      return;
    }
    std::mutex localMutex;
    std::unique_lock cv_lock(localMutex);
    iter->second.cv.wait(cv_lock, [&] { return iter->second.isReady; });
  }
  // When we know that context is initialized, it's safe to use unique_lock
  // without risk of a deadlock.
  {
    std::unique_lock lock(manager.contextLookupMutex);
    auto iter = manager.contextMap.find(id);
    if (iter == manager.contextMap.end()) {
      EXGLSysLog("Unable to destory context. Context not found.");
      return;
    }
    {
      std::unique_lock lock(iter->second.mutex);
      delete iter->second.ctx;
      iter->second.ctx = nullptr;
    }
    manager.contextMap.erase(iter);
  }
}

} // namespace gl_cpp
} // namespace expo
