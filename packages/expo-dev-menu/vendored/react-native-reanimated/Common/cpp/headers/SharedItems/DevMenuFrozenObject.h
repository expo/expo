#pragma once

#include <jsi/jsi.h>
#include <memory>
#include <string>
#include <unordered_map>
#include <vector>
#include "DevMenuRuntimeManager.h"
#include "DevMenuSharedParent.h"
#include "DevMenuWorkletsCache.h"

using namespace facebook;

namespace devmenureanimated {

class FrozenObject : public jsi::HostObject {
  friend WorkletsCache;
  friend void extractMutables(
      jsi::Runtime &rt,
      std::shared_ptr<ShareableValue> sv,
      std::vector<std::shared_ptr<MutableValue>> &res);

 private:
  std::unordered_map<std::string, std::shared_ptr<ShareableValue>> map;
  std::vector<std::string> namesOrder;

 public:
  FrozenObject(
      jsi::Runtime &rt,
      const jsi::Object &object,
      RuntimeManager *runtimeManager);
  jsi::Object shallowClone(jsi::Runtime &rt);
  bool containsHostFunction = false;
};

} // namespace devmenureanimated
