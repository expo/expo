#ifndef JSIStoreValueUser_h
#define JSIStoreValueUser_h

#include <stdio.h>
#include <memory>
#include <vector>
#include <unordered_map>
#include <jsi/jsi.h>
#include <mutex>
#include "DevMenuScheduler.h"

using namespace facebook;

namespace devmenureanimated {

struct StaticStoreUser {
    std::atomic<int> ctr;
    std::unordered_map<int, std::vector<std::shared_ptr<jsi::Value>>> store;
    std::recursive_mutex storeMutex;
};

class StoreUser {
  int identifier = 0;
  static std::shared_ptr<StaticStoreUser> staticStoreUserData;
  std::shared_ptr<StaticStoreUser> storeUserData;
  std::weak_ptr<Scheduler> scheduler;
  
public:
  StoreUser(std::shared_ptr<Scheduler> s);
  
  std::weak_ptr<jsi::Value> getWeakRef(jsi::Runtime &rt);
  void removeRefs();
  
  static void clearStore();
  virtual ~StoreUser();
};

}

#endif /* JSIStoreValueUser_h */
