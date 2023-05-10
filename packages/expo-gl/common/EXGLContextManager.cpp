#include "EXGLContextManager.h"

namespace expo {
namespace gl_cpp {

struct ContextState {
  EXGLContext *ctx;
  std::shared_mutex mutex;
  std::promise<void> isReadyPromise;
  std::future<void> isReady;
  bool isBeingDestroyed = false;
};

struct ContextManager {
  std::unordered_map<EXGLContextId, ContextState> contextMap;
  std::shared_mutex contextLookupMutex;
  EXGLContextId nextId = 1;
};

ContextManager manager;

ContextWithLock ContextGet(EXGLContextId id) {
  std::shared_lock lock(manager.contextLookupMutex);
  auto iter = manager.contextMap.find(id);
  if (iter == manager.contextMap.end() || iter->second.isBeingDestroyed) {
    return {nullptr, std::shared_lock<std::shared_mutex>()};
  }
  return {iter->second.ctx, std::shared_lock(iter->second.mutex)};
}

void ContextMarkReady(EXGLContextId id) {
  std::shared_lock lock(manager.contextLookupMutex);
  auto iter = manager.contextMap.find(id);
  if (iter == manager.contextMap.end() || iter->second.isBeingDestroyed) {
    EXGLSysLog("No context to mark as ready");
    return;
  }
  std::shared_lock contextLock(iter->second.mutex);
  iter->second.isReadyPromise.set_value();
}

void ContextMarkPrepareStart(EXGLContextId id) {
  std::shared_lock lock(manager.contextLookupMutex);
  auto iter = manager.contextMap.find(id);
  if (iter == manager.contextMap.end() || iter->second.isBeingDestroyed) {
    EXGLSysLog("No context to mark as ready");
    return;
  }
  std::unique_lock contextLock(iter->second.mutex);
  iter->second.isReady = iter->second.isReadyPromise.get_future();
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
  {
    std::shared_lock lock(manager.contextLookupMutex);
    auto iter = manager.contextMap.find(id);
    if (iter == manager.contextMap.end()) {
      EXGLSysLog("Unable to destory context. Context not found.");
      return;
    }

    // Wait for isReady to be set if future is valid, otherwise we know that
    // ContextPrepare was not called yet, so we can just conntinue.
    // Set isBeingDestroyed = true to make sure any ContextGet calls from
    // now on will return nullptr.
    {
      std::shared_lock contextLock(iter->second.mutex);
      if (iter->second.isReady.valid()) {
        iter->second.isReady.wait();
      }
      iter->second.isBeingDestroyed = true;
    }

    // When we know that context is initialized, it's safe to use unique_lock
    // without risk of a deadlock.
    std::unique_lock contextLock(iter->second.mutex);
    delete iter->second.ctx;
    iter->second.ctx = nullptr;
  }
  // Remove entry from map (at this point nothing should hold a shared_lock on the context)
  {
    std::unique_lock lock(manager.contextLookupMutex);
    auto iter = manager.contextMap.find(id);
    if (iter == manager.contextMap.end()) {
      EXGLSysLog("Unable to destory context. Context not found.");
      return;
    }
    manager.contextMap.erase(iter);
  }
}

} // namespace gl_cpp
} // namespace expo
