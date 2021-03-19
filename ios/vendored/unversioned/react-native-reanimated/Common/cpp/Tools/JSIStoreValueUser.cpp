#include "JSIStoreValueUser.h"

namespace reanimated {

std::atomic<int> StoreUser::ctr;
std::recursive_mutex StoreUser::storeMutex;
std::unordered_map<int, std::vector<std::shared_ptr<jsi::Value>>> StoreUser::store;

std::weak_ptr<jsi::Value> StoreUser::getWeakRef(jsi::Runtime &rt) {
  const std::lock_guard<std::recursive_mutex> lock(storeMutex);
  if (StoreUser::store.count(identifier) == 0) {
    StoreUser::store[identifier] = std::vector<std::shared_ptr<jsi::Value>>();
  }
  std::shared_ptr<jsi::Value> sv = std::make_shared<jsi::Value>(rt, jsi::Value::undefined());
  StoreUser::store[identifier].push_back(sv);
  
  return sv;
}

StoreUser::StoreUser(std::shared_ptr<Scheduler> s): scheduler(s) {
  identifier = StoreUser::ctr++;
}

StoreUser::~StoreUser() {
  int id = identifier;
  std::shared_ptr<Scheduler> strongScheduler = scheduler.lock();
  if (strongScheduler != nullptr) {
    strongScheduler->scheduleOnUI([id]() {
      const std::lock_guard<std::recursive_mutex> lock(storeMutex);
      if (StoreUser::store.count(id) > 0) {
        StoreUser::store.erase(id);
      }
    });
  }
}


void StoreUser::clearStore() {
  const std::lock_guard<std::recursive_mutex> lock(storeMutex);
  StoreUser::store.clear();
}

}
