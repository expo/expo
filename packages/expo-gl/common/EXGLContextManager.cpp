#include "EXGLContextManager.h"
#include <mutex>

namespace expo {
namespace gl_cpp {

struct ContextState {
  EXGLContext *ctx;
  std::shared_mutex mutex;
};

struct ContextManager {
  std::unordered_map<EXGLContextId, ContextState> contextMap;
  std::shared_mutex contextLookupMutex;
  EXGLContextId nextId = 1;
};

ContextManager manager;

// When multiple threads are attempting to establish shared and unique locks on a mutex
// we can reach a situation where an unique lock gets priority to run first, but waits
// for existing shared locks to be released, while no new shared locks can be acquired.
//
// When we run ContextPrepare we hold a shared lock, but we also trigger flush on
// a different thread which also needs to hold a shared lock. This situation can lead
// to deadlock if unique lock have a priority and flush can never start.
//
// This solution resolves an issue, but introduces a risk that uniqe lock will never
// be establish, but given the use-case that should never happen.
std::unique_lock<std::shared_mutex> getUniqueLockSafely(std::shared_mutex &mutex) {
  std::unique_lock lock(mutex, std::defer_lock);
  while (!lock.try_lock()) {
    std::this_thread::sleep_for(std::chrono::milliseconds(1));
  }
  return lock;
}

ContextWithLock ContextGet(EXGLContextId id) {
  std::shared_lock lock(manager.contextLookupMutex);
  auto iter = manager.contextMap.find(id);
  // if ctx is null then destroy is in progress
  if (iter == manager.contextMap.end() || iter->second.ctx == nullptr) {
    return {nullptr, std::shared_lock<std::shared_mutex>()};
  }
  return {iter->second.ctx, std::shared_lock(iter->second.mutex)};
}

EXGLContextId ContextCreate() {
  // Out of ids?
  if (manager.nextId >= std::numeric_limits<EXGLContextId>::max()) {
    EXGLSysLog("Ran out of EXGLContext ids!");
    return 0;
  }

  std::unique_lock lock = getUniqueLockSafely(manager.contextLookupMutex);
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
    if (iter != manager.contextMap.end()) {
      std::unique_lock lock = getUniqueLockSafely(iter->second.mutex);
      delete iter->second.ctx;
      iter->second.ctx = nullptr;
    }
  }

  std::unique_lock lock = getUniqueLockSafely(manager.contextLookupMutex);
  auto iter = manager.contextMap.find(id);
  if (iter != manager.contextMap.end()) {
    manager.contextMap.erase(iter);
  }
}

} // namespace gl_cpp
} // namespace expo
