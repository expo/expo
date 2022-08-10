#include "DevMenuJSIStoreValueUser.h"
#include "DevMenuRuntimeManager.h"
#ifdef ONANDROID
#include <AndroidScheduler.h>
#endif

namespace devmenureanimated {

std::weak_ptr<jsi::Value> StoreUser::getWeakRef(jsi::Runtime &rt) {
  const std::lock_guard<std::recursive_mutex> lock(storeUserData->storeMutex);
  if (storeUserData->store.count(identifier) == 0) {
    storeUserData->store[identifier] =
        std::vector<std::shared_ptr<jsi::Value>>();
  }
  std::shared_ptr<jsi::Value> sv =
      std::make_shared<jsi::Value>(rt, jsi::Value::undefined());
  storeUserData->store[identifier].push_back(sv);

  return sv;
}

StoreUser::StoreUser(
    std::shared_ptr<Scheduler> s,
    const RuntimeManager &runtimeManager)
    : scheduler(s) {
  storeUserData = runtimeManager.storeUserData;
  identifier = storeUserData->ctr++;
}

StoreUser::~StoreUser() {
  int id = identifier;
  std::shared_ptr<Scheduler> strongScheduler = scheduler.lock();
  if (strongScheduler != nullptr) {
    std::shared_ptr<StaticStoreUser> sud = storeUserData;
#ifdef ONANDROID
    jni::ThreadScope::WithClassLoader([&] {
      strongScheduler->scheduleOnUI([id, sud]() {
        const std::lock_guard<std::recursive_mutex> lock(sud->storeMutex);
        if (sud->store.count(id) > 0) {
          sud->store.erase(id);
        }
      });
    });
#else
    strongScheduler->scheduleOnUI([id, sud]() {
      const std::lock_guard<std::recursive_mutex> lock(sud->storeMutex);
      if (sud->store.count(id) > 0) {
        sud->store.erase(id);
      }
    });
#endif
  }
}

} // namespace devmenureanimated
