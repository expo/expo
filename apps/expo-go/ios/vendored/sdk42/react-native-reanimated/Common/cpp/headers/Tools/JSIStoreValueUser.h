#ifndef JSIStoreValueUser_h
#define JSIStoreValueUser_h

#include <stdio.h>
#include <memory>
#include <vector>
#include <unordered_map>
#include <ABI42_0_0jsi/ABI42_0_0jsi.h>
#include <mutex>
#include "Scheduler.h"

using namespace ABI42_0_0facebook;

namespace ABI42_0_0reanimated {

class StoreUser {
  int identifier = 0;
  static std::atomic<int> ctr;
  static std::unordered_map<int, std::vector<std::shared_ptr<jsi::Value>>> store;
  static std::recursive_mutex storeMutex;
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
