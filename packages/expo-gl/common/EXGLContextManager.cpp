#include "EXGLContextManager.h"

namespace expo {
namespace gl_cpp {

struct ContextManager {
  std::unordered_map<EXGLContextId, std::shared_ptr<EXGLContext>> contextMap;
  std::shared_mutex contextLookupMutex;
  EXGLContextId nextId = 1;
};

ContextManager manager;

std::shared_ptr<EXGLContext> ContextGet(EXGLContextId id) {
  std::shared_lock lock(manager.contextLookupMutex);
  auto iter = manager.contextMap.find(id);
  // if ctx is null then destroy is in progress
  if (iter == manager.contextMap.end() || iter->second == nullptr) {
    return nullptr;
  }
  return iter->second;
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
  manager.contextMap[ctxId] = std::make_shared<EXGLContext>(ctxId);
  return ctxId;
}

void ContextDestroy(EXGLContextId id) {
  std::unique_lock lock(manager.contextLookupMutex);

  auto iter = manager.contextMap.find(id);
  if (iter != manager.contextMap.end()) {
    iter->second->maybeBlockingTaskPromise.set_value();
    manager.contextMap.erase(iter);
  }
}

} // namespace gl_cpp
} // namespace expo
